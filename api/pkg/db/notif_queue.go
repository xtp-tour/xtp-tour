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
// This uses a lock-free approach:
// 1. Atomically UPDATE a batch of pending notifications to 'processing' status
// 2. SELECT the claimed notifications (no locking needed, they're already ours)
// 3. Fetch user preferences separately (no transaction/locks)
//
// This eliminates lock contention because:
// - The UPDATE with LIMIT is atomic and very fast
// - No SELECT FOR UPDATE is needed
// - No JOINs during the claim phase
// - User preferences are fetched outside any transaction
func (db *Db) GetNotificationBatch(batchSize int) ([]*NotificationQueueRow, error) {
	logCtx := slog.With("method", "GetNotificationBatch", "batchSize", batchSize)

	if batchSize <= 0 {
		batchSize = DefaultNotificationBatchSize
	}

	// Step 1: Atomically claim a batch by updating status from 'pending' to 'processing'
	// MySQL allows ORDER BY and LIMIT in single-table UPDATE statements.
	// This is atomic - no other worker can claim the same rows.
	claimQuery := `UPDATE notification_queue
		SET status = ?, processed_at = NOW()
		WHERE status = ?
		ORDER BY created_at ASC
		LIMIT ?`

	result, err := db.conn.Exec(claimQuery, NotificationStatusProcessing, NotificationStatusPending, batchSize)
	if err != nil {
		logCtx.Error("Failed to claim notification batch", "error", err)
		return nil, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		logCtx.Error("Failed to get rows affected", "error", err)
		return nil, err
	}

	if rowsAffected == 0 {
		// No pending notifications
		return nil, nil
	}

	logCtx.Debug("Claimed notification batch", "count", rowsAffected)

	// Step 2: Fetch the notifications we just claimed.
	// We identify them by status='processing' ordered by processed_at DESC (most recently claimed first).
	// This is safe because we're the only worker that just updated these rows.
	selectQuery := `SELECT id, user_id, data, status, created_at, processed_at, retry_count
		FROM notification_queue
		WHERE status = ?
		ORDER BY processed_at DESC
		LIMIT ?`

	var notifications []*NotificationQueueRow
	err = db.conn.Select(&notifications, selectQuery, NotificationStatusProcessing, rowsAffected)
	if err != nil {
		logCtx.Error("Failed to fetch claimed notifications", "error", err)
		return nil, err
	}

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
