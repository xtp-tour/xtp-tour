package db

import (
	"database/sql"
	"log/slog"

	"github.com/google/uuid"
)

type NotifQueueDb interface {
	EnqueueNotification(userId string, data NotificationQueueData) error
	GetNextNotification() (*NotificationQueueRow, error)
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

func (db *Db) GetNextNotification() (*NotificationQueueRow, error) {
	logCtx := slog.With("method", "GetNextNotification")

	tx, err := db.conn.Beginx()
	defer func() {
		err := tx.Commit()
		if err != nil {
			logCtx.Error("Failed to commit transaction", "error", err)
		}
	}()
	if err != nil {
		logCtx.Error("Failed to begin transaction", "error", err)
		terr := tx.Rollback()
		if terr != nil {
			logCtx.Error("Failed to rollback transaction", "error", err)
		}
		return nil, err
	}

	query := `SELECT
		nq.id, nq.user_id, nq.data, nq.status, nq.created_at, nq.processed_at, nq.retry_count,
		COALESCE(up.notifications, '{}') AS user_preferences
		FROM notification_queue nq
		LEFT JOIN user_pref up ON nq.user_id = up.uid
		WHERE nq.status = ?
		ORDER BY nq.created_at ASC
		LIMIT 1
		FOR UPDATE`

	var notification NotificationQueueRow
	err = tx.Get(&notification, query, NotificationStatusPending)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}

		logCtx.Error("Failed to get next notification", "error", err)
		db.rollback(logCtx, tx)
		return nil, err
	}

	updateQuery := `UPDATE notification_queue SET status = ? WHERE id = ?`
	logCtx.Debug("Executing SQL query", "query", updateQuery, "params", []interface{}{NotificationStatusProcessing, notification.Id})
	_, err = tx.Exec(updateQuery, NotificationStatusProcessing, notification.Id)
	if err != nil {
		logCtx.Error("Failed to update notification status to processing", "error", err, "id", notification.Id)
		db.rollback(logCtx, tx)
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		logCtx.Error("Failed to commit transaction", "error", err)
		db.rollback(logCtx, tx)
		return nil, err
	}

	notification.Status = NotificationStatusProcessing
	return &notification, nil
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
