package db

import (
	"log/slog"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

// Default batch size for notification processing
const DefaultNotificationBatchSize = 20

type NotifQueueDb interface {
	EnqueueNotification(userId string, data NotificationQueueData) error
	GetNotificationBatch(batchSize int) ([]*NotificationQueueRow, error)
	UpdateNotificationStatus(id, status string) error
	IncrementRetryCount(id string) error
}

func (db *Db) EnqueueNotification(userId string, data NotificationQueueData) error {
	id := uuid.New().String()

	query := `INSERT INTO notification_queue (id, user_id, data, status, created_at, retry_count)
		VALUES (?, ?, ?, ?, NOW(), 0)`

	slog.Debug("Enqueuing notification", "id", id, "userId", userId, "topic", data.Topic)

	_, err := db.conn.Exec(query, id, userId, &data, NotificationStatusPending)
	if err != nil {
		slog.Error("Failed to enqueue notification", "error", err, "userId", userId, "topic", data.Topic)
		return err
	}

	return nil
}

// GetNotificationBatch claims and returns a batch of pending notifications.
// This uses a minimal-lock approach:
// 1. Transaction: SELECT IDs with FOR UPDATE SKIP LOCKED, UPDATE status, SELECT full data
// 2. Commit only after all data is fetched (prevents orphaning on failure)
// 3. Fetch user preferences separately (can fail without orphaning notifications)
//
// This eliminates lock contention because:
// - SKIP LOCKED prevents waiting on rows locked by other workers
// - Batch processing reduces lock frequency by ~20x vs one-at-a-time
// - No JOINs with user_pref during the transaction
// - User preferences are fetched outside the transaction
func (db *Db) GetNotificationBatch(batchSize int) ([]*NotificationQueueRow, error) {
	logCtx := slog.With("method", "GetNotificationBatch", "batchSize", batchSize)

	if batchSize <= 0 {
		batchSize = DefaultNotificationBatchSize
	}

	// Start transaction - we only commit after successfully fetching all data
	// This prevents orphaning notifications if any step fails
	tx, err := db.conn.Beginx()
	if err != nil {
		logCtx.Error("Failed to begin transaction", "error", err)
		return nil, err
	}

	// Step 1: Select IDs to claim with FOR UPDATE SKIP LOCKED
	// SKIP LOCKED ensures we don't wait on rows locked by other workers
	var ids []string
	selectIdsQuery := `SELECT id FROM notification_queue
		WHERE status = ?
		ORDER BY created_at ASC
		LIMIT ?
		FOR UPDATE SKIP LOCKED`

	err = tx.Select(&ids, selectIdsQuery, NotificationStatusPending, batchSize)
	if err != nil {
		db.rollback(logCtx, tx)
		logCtx.Error("Failed to select notification IDs", "error", err)
		return nil, err
	}

	if len(ids) == 0 {
		db.rollback(logCtx, tx)
		return nil, nil
	}

	// Step 2: Update the claimed rows to 'processing' status
	updateQuery, args, err := sqlx.In(
		`UPDATE notification_queue SET status = ?, processed_at = NOW() WHERE id IN (?)`,
		NotificationStatusProcessing, ids)
	if err != nil {
		db.rollback(logCtx, tx)
		logCtx.Error("Failed to prepare update query", "error", err)
		return nil, err
	}
	updateQuery = db.conn.Rebind(updateQuery)

	_, err = tx.Exec(updateQuery, args...)
	if err != nil {
		db.rollback(logCtx, tx)
		logCtx.Error("Failed to update notification status", "error", err)
		return nil, err
	}

	// Step 3: Fetch full notification data WITHIN the transaction
	// This ensures we don't commit until we have all the data we need
	selectQuery, args, err := sqlx.In(
		`SELECT id, user_id, data, status, created_at, processed_at, retry_count
		FROM notification_queue WHERE id IN (?)`, ids)
	if err != nil {
		db.rollback(logCtx, tx)
		logCtx.Error("Failed to prepare select query", "error", err)
		return nil, err
	}
	selectQuery = tx.Rebind(selectQuery)

	var notifications []*NotificationQueueRow
	err = tx.Select(&notifications, selectQuery, args...)
	if err != nil {
		db.rollback(logCtx, tx)
		logCtx.Error("Failed to fetch claimed notifications", "error", err)
		return nil, err
	}

	// Step 4: Commit transaction - only now that we have all the data
	// If anything above failed, we rolled back and notifications stay 'pending'
	err = tx.Commit()
	if err != nil {
		db.rollback(logCtx, tx)
		logCtx.Error("Failed to commit transaction", "error", err)
		return nil, err
	}

	logCtx.Debug("Claimed notification batch", "count", len(notifications))

	if len(notifications) == 0 {
		return nil, nil
	}

	// Step 3: Fetch user preferences for all notifications in a single query (no locks)
	userIds := make([]string, 0, len(notifications))
	userIdSet := make(map[string]bool)
	for _, n := range notifications {
		if !userIdSet[n.UserId] {
			userIds = append(userIds, n.UserId)
			userIdSet[n.UserId] = true
		}
	}

	userPrefs := make(map[string]NotificationSettings)
	if len(userIds) > 0 {
		prefQuery := `SELECT uid, COALESCE(notifications, '{}') as notifications FROM user_pref WHERE uid IN (?)`
		query, args, err := sqlx.In(prefQuery, userIds)
		if err != nil {
			logCtx.Warn("Failed to prepare user preferences query", "error", err)
		} else {
			query = db.conn.Rebind(query)
			rows, err := db.conn.Queryx(query, args...)
			if err != nil {
				logCtx.Warn("Failed to fetch user preferences", "error", err)
			} else {
				defer rows.Close()
				for rows.Next() {
					var uid string
					var settings NotificationSettings
					if err := rows.Scan(&uid, &settings); err != nil {
						logCtx.Warn("Failed to scan user preferences", "error", err)
						continue
					}
					userPrefs[uid] = settings
				}
				// Check for errors that occurred during iteration
				if err := rows.Err(); err != nil {
					logCtx.Warn("Error during user preferences iteration", "error", err)
				}
			}
		}
	}

	// Apply user preferences to notifications
	for _, n := range notifications {
		if prefs, ok := userPrefs[n.UserId]; ok {
			n.UserPreferences.Notifications = prefs
		}
	}

	logCtx.Debug("Fetched notification batch with preferences", "count", len(notifications))
	return notifications, nil
}

func (db *Db) UpdateNotificationStatus(id, status string) error {
	query := `UPDATE notification_queue SET status = ?, processed_at = NOW() WHERE id = ?`

	slog.Debug("Updating notification status", "id", id, "status", status)

	result, err := db.conn.Exec(query, status, id)
	if err != nil {
		slog.Error("Failed to update notification status", "error", err, "id", id, "status", status)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		slog.Error("Failed to get rows affected", "error", err)
		return err
	}

	if rowsAffected == 0 {
		return DbObjectNotFoundError{Message: "Notification not found"}
	}

	return nil
}

func (db *Db) IncrementRetryCount(id string) error {
	query := `UPDATE notification_queue SET retry_count = retry_count + 1, status = ?, processed_at = NOW() WHERE id = ?`

	slog.Debug("Incrementing retry count", "id", id)

	result, err := db.conn.Exec(query, NotificationStatusPending, id)
	if err != nil {
		slog.Error("Failed to increment retry count", "error", err, "id", id)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		slog.Error("Failed to get rows affected", "error", err)
		return err
	}

	if rowsAffected == 0 {
		return DbObjectNotFoundError{Message: "Notification not found"}
	}

	return nil
}
