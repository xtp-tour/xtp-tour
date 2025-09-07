package notifications

import (
	"context"

	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

type Queue interface {
	Enqueue(ctx context.Context, userId string, data db.NotificationQueueData) error
	GetNext(ctx context.Context) (*db.NotificationQueueRow, error)
	MarkCompleted(ctx context.Context, id string) error
	MarkFailed(ctx context.Context, id string) error
	IncrementRetryCount(ctx context.Context, id string) error
}

type DbQueue struct {
	db db.NotifQueueDb
}

func NewDbQueue(database db.NotifQueueDb) *DbQueue {
	return &DbQueue{
		db: database,
	}
}

func (q *DbQueue) Enqueue(ctx context.Context, userId string, data db.NotificationQueueData) error {
	return q.db.EnqueueNotification(userId, data)
}

func (q *DbQueue) GetNext(ctx context.Context) (*db.NotificationQueueRow, error) {
	return q.db.GetNextNotification()
}

func (q *DbQueue) MarkCompleted(ctx context.Context, id string) error {
	return q.db.UpdateNotificationStatus(id, db.NotificationStatusCompleted)
}

func (q *DbQueue) MarkFailed(ctx context.Context, id string) error {
	return q.db.UpdateNotificationStatus(id, db.NotificationStatusFailed)
}

func (q *DbQueue) IncrementRetryCount(ctx context.Context, id string) error {
	return q.db.IncrementRetryCount(id)
}
