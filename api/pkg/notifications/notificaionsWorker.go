package notifications

import (
	"context"
	"log/slog"
	"sync"
	"time"

	"github.com/xtp-tour/xtp-tour/api/pkg"
)

type NotificationWorker struct {
	queue         Queue
	sender        Sender
	logger        *slog.Logger
	done          chan struct{}
	maxRetries    int
	tickerSeconds int
	nMutex        sync.Mutex
}

func NewNotificationWorker(queue Queue, sender Sender, config pkg.NotificationConfig) *NotificationWorker {
	return &NotificationWorker{
		queue:         queue,
		sender:        sender,
		logger:        slog.Default(),
		done:          make(chan struct{}),
		maxRetries:    config.MaxRetries,
		tickerSeconds: config.TickerSeconds,
	}
}

func (w *NotificationWorker) Start(ctx context.Context) {
	w.logger.Info("Starting notification worker", "tickerSeconds", w.tickerSeconds, "maxRetries", w.maxRetries)

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

	for {
		notification, err := w.queue.GetNext(ctx)
		if err != nil {
			w.logger.Error("Failed to get next notification from queue", "error", err)
			return
		}

		if notification == nil {
			return
		}

		w.logger.Debug("Processing notification",
			"id", notification.Id,
			"userId", notification.UserId,
			"topic", notification.Data.Topic)

		if err := w.sender.Send(ctx, notification); err != nil {
			w.logger.Error("Failed to send notification",
				"error", err,
				"id", notification.Id,
				"userId", notification.UserId,
				"topic", notification.Data.Topic,
				"retryCount", notification.RetryCount,
				"maxRetries", w.maxRetries)

			// Check if we should retry or mark as permanently failed
			if notification.RetryCount >= w.maxRetries {
				w.logger.Warn("Notification exceeded max retries, marking as failed",
					"id", notification.Id,
					"retryCount", notification.RetryCount,
					"maxRetries", w.maxRetries)

				if err := w.queue.MarkFailed(ctx, notification.Id); err != nil {
					w.logger.Error("Failed to mark notification as permanently failed", "error", err, "id", notification.Id)
				}
			} else {
				if err := w.queue.IncrementRetryCount(ctx, notification.Id); err != nil {
					w.logger.Error("Failed to increment retry count", "error", err, "id", notification.Id)
				} else {
					w.logger.Info("Notification queued for retry",
						"id", notification.Id,
						"retryCount", notification.RetryCount+1,
						"maxRetries", w.maxRetries)
				}
			}
			continue
		}

		if err := w.queue.MarkCompleted(ctx, notification.Id); err != nil {
			w.logger.Error("Failed to mark notification as completed", "error", err, "id", notification.Id)
		} else {
			w.logger.Debug("Notification processed successfully", "id", notification.Id)
		}
	}
}
