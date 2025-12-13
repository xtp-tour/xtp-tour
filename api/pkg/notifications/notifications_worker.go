package notifications

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

// Default batch size if not configured
const DefaultBatchSize = 20

type NotificationWorker struct {
	queue         Queue
	sender        Sender
	logger        *slog.Logger
	done          chan struct{}
	maxRetries    int
	tickerSeconds int
	batchSize     int
	nMutex        sync.Mutex
}

func NewNotificationWorker(queue Queue, sender Sender, config pkg.NotificationConfig) *NotificationWorker {
	batchSize := config.BatchSize
	if batchSize <= 0 {
		batchSize = DefaultBatchSize
	}

	return &NotificationWorker{
		queue:         queue,
		sender:        sender,
		logger:        slog.Default(),
		done:          make(chan struct{}),
		maxRetries:    config.MaxRetries,
		tickerSeconds: config.TickerSeconds,
		batchSize:     batchSize,
	}
}

func (w *NotificationWorker) Start(ctx context.Context) {
	w.logger.Info("Starting notification worker",
		"tickerSeconds", w.tickerSeconds,
		"maxRetries", w.maxRetries,
		"batchSize", w.batchSize)

	ticker := time.NewTicker(time.Duration(w.tickerSeconds) * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("Notification worker stopping due to context cancellation")
			close(w.done)
			return
		case <-w.done:
			w.logger.Info("Notification worker stopped")
			return
		case <-ticker.C:
			w.processNotifications(ctx)
		}
	}
}

func (w *NotificationWorker) Stop() {
	w.logger.Info("Stopping notification worker")
	close(w.done)
}

func (w *NotificationWorker) processNotifications(ctx context.Context) {
	w.nMutex.Lock()
	defer w.nMutex.Unlock()

	// Keep processing batches until no more pending notifications
	for {
		// Fetch a batch of notifications (lock-free operation)
		notifications, err := w.queue.GetBatch(ctx, w.batchSize)
		if err != nil {
			w.logger.Error("Failed to get notification batch from queue", "error", err)
			return
		}

		if len(notifications) == 0 {
			return
		}

		w.logger.Debug("Processing notification batch", "count", len(notifications))

		// Process each notification in the batch
		for _, notification := range notifications {
			w.processNotification(ctx, notification)
		}
	}
}

func (w *NotificationWorker) processNotification(ctx context.Context, notification *db.NotificationQueueRow) {
	logCtx := w.logger.With(
		"id", notification.Id,
		"userId", notification.UserId,
		"topic", notification.Data.Topic,
	)

	logCtx.Debug("Processing notification")

	if err := w.sender.Send(ctx, notification); err != nil {
		logCtx.Error("Failed to send notification",
			"error", err,
			"retryCount", notification.RetryCount,
			"maxRetries", w.maxRetries)

		// Check if we should retry or mark as permanently failed
		if notification.RetryCount >= w.maxRetries {
			logCtx.Warn("Notification exceeded max retries, marking as failed",
				"retryCount", notification.RetryCount,
				"maxRetries", w.maxRetries)

			if err := w.queue.MarkFailed(ctx, notification.Id); err != nil {
				logCtx.Error("Failed to mark notification as permanently failed", "error", err)
			}
		} else {
			if err := w.queue.IncrementRetryCount(ctx, notification.Id); err != nil {
				logCtx.Error("Failed to increment retry count", "error", err)
			} else {
				logCtx.Info("Notification queued for retry",
					"retryCount", notification.RetryCount+1,
					"maxRetries", w.maxRetries)
			}
		}
		return
	}

	if err := w.queue.MarkCompleted(ctx, notification.Id); err != nil {
		logCtx.Error("Failed to mark notification as completed", "error", err)
	} else {
		logCtx.Debug("Notification processed successfully")
	}
}
