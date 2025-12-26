package jobs

import (
	"context"
	"log/slog"
	"time"

	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

// Default ticker interval (5 minutes
const DefaultExpirationTickerSeconds = 300

// ExpirationDb defines the database operations needed by the expiration worker
type ExpirationDb interface {
	MarkExpiredEvents(ctx context.Context, limit int) ([]db.ExpiredEventInfo, error)
}

// ExpirationNotifier defines the notification operations needed by the expiration worker
type ExpirationNotifier interface {
	EventExpired(userId string, eventId string)
}

// ExpirationWorker periodically checks for expired events and updates their status
type ExpirationWorker struct {
	db       ExpirationDb
	notifier ExpirationNotifier
	logger   *slog.Logger
}

// NewExpirationWorker creates a new expiration worker
func NewExpirationWorker(database ExpirationDb, notifier ExpirationNotifier) *ExpirationWorker {
	return &ExpirationWorker{
		db:       database,
		notifier: notifier,
		logger:   slog.With("service", "jobs"),
	}
}

// Start begins the expiration worker loop
func (w *ExpirationWorker) Start(ctx context.Context, interval time.Duration) {
	w.logger.Info("Starting expiration worker", "interval", interval)

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			w.logger.Info("Expiration worker stopping due to context cancellation")
			return
		case <-ticker.C:
			w.processExpiredEvents(ctx)
		}
	}
}

func (w *ExpirationWorker) processExpiredEvents(ctx context.Context) {
	const batchSize = 100
	totalExpired := 0

	for {
		expiredEvents, err := w.db.MarkExpiredEvents(ctx, batchSize)
		if err != nil {
			w.logger.Error("Failed to mark expired events", "error", err)
			return
		}

		if len(expiredEvents) == 0 {
			break
		}
		w.logger.Info("Marked expired events", "count", len(expiredEvents))

		totalExpired += len(expiredEvents)

		// Notify each expired event owner
		for _, event := range expiredEvents {
			w.notifier.EventExpired(event.UserId, event.EventId)
		}

		if len(expiredEvents) < batchSize {
			break
		}
	}

	if totalExpired > 0 {
		w.logger.Info("Marked events as expired", "count", totalExpired)
	} else {
		w.logger.Debug("No expired events found")
	}
}
