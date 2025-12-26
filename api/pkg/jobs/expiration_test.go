package jobs

import (
	"context"
	"errors"
	"testing"

	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"github.com/xtp-tour/xtp-tour/api/pkg/jobs/mocks"
)

func TestProcessExpiredEvents_NoExpiredEvents(t *testing.T) {
	ctx := context.Background()

	mockDb := mocks.NewMockExpirationDb(t)
	mockNotifier := mocks.NewMockExpirationNotifier(t)
	mockDb.EXPECT().MarkExpiredEvents(ctx, 100).Return([]db.ExpiredEventInfo{}, nil).Once()

	worker := NewExpirationWorker(mockDb, mockNotifier)
	worker.processExpiredEvents(ctx)

	// Expectations are automatically verified by mockery
}

func TestProcessExpiredEvents_SingleBatch(t *testing.T) {
	ctx := context.Background()

	mockDb := mocks.NewMockExpirationDb(t)
	mockNotifier := mocks.NewMockExpirationNotifier(t)

	expiredEvents := []db.ExpiredEventInfo{
		{EventId: "event_1", UserId: "user_1"},
		{EventId: "event_2", UserId: "user_2"},
		{EventId: "event_3", UserId: "user_1"},
	}

	// First call returns events, second returns empty (less than batch size triggers break)
	mockDb.EXPECT().MarkExpiredEvents(ctx, 100).Return(expiredEvents, nil).Once()

	// Should notify each event owner
	mockNotifier.EXPECT().EventExpired("user_1", "event_1").Return().Once()
	mockNotifier.EXPECT().EventExpired("user_2", "event_2").Return().Once()
	mockNotifier.EXPECT().EventExpired("user_1", "event_3").Return().Once()

	worker := NewExpirationWorker(mockDb, mockNotifier)
	worker.processExpiredEvents(ctx)

	// Expectations are automatically verified by mockery
}

func TestProcessExpiredEvents_MultipleBatches(t *testing.T) {
	ctx := context.Background()

	mockDb := mocks.NewMockExpirationDb(t)
	mockNotifier := mocks.NewMockExpirationNotifier(t)

	// Generate first batch of exactly 100 events (batch size)
	firstBatch := make([]db.ExpiredEventInfo, 100)
	for i := 0; i < 100; i++ {
		firstBatch[i] = db.ExpiredEventInfo{
			EventId: "event_batch1_" + string(rune('0'+i%10)),
			UserId:  "user_batch1",
		}
	}

	// Second batch has fewer events
	secondBatch := []db.ExpiredEventInfo{
		{EventId: "event_batch2_1", UserId: "user_batch2"},
		{EventId: "event_batch2_2", UserId: "user_batch2"},
	}

	// First call returns full batch, second returns partial batch
	mockDb.EXPECT().MarkExpiredEvents(ctx, 100).Return(firstBatch, nil).Once()
	mockDb.EXPECT().MarkExpiredEvents(ctx, 100).Return(secondBatch, nil).Once()

	// Should notify all events from both batches
	for _, event := range firstBatch {
		mockNotifier.EXPECT().EventExpired(event.UserId, event.EventId).Return().Once()
	}
	for _, event := range secondBatch {
		mockNotifier.EXPECT().EventExpired(event.UserId, event.EventId).Return().Once()
	}

	worker := NewExpirationWorker(mockDb, mockNotifier)
	worker.processExpiredEvents(ctx)

	// Expectations are automatically verified by mockery
}

func TestProcessExpiredEvents_DatabaseError(t *testing.T) {
	ctx := context.Background()

	mockDb := mocks.NewMockExpirationDb(t)
	mockNotifier := mocks.NewMockExpirationNotifier(t)

	// Database returns an error
	mockDb.EXPECT().MarkExpiredEvents(ctx, 100).Return(nil, errors.New("database connection failed")).Once()

	worker := NewExpirationWorker(mockDb, mockNotifier)
	worker.processExpiredEvents(ctx)

	// No notifications should be sent when DB errors
	// Expectations are automatically verified by mockery
}

func TestProcessExpiredEvents_DatabaseErrorAfterFirstBatch(t *testing.T) {
	ctx := context.Background()

	mockDb := mocks.NewMockExpirationDb(t)
	mockNotifier := mocks.NewMockExpirationNotifier(t)

	// Generate first batch of exactly 100 events (batch size)
	firstBatch := make([]db.ExpiredEventInfo, 100)
	for i := 0; i < 100; i++ {
		firstBatch[i] = db.ExpiredEventInfo{
			EventId: "event_" + string(rune('a'+i%26)),
			UserId:  "user_1",
		}
	}

	// First call succeeds, second fails
	mockDb.EXPECT().MarkExpiredEvents(ctx, 100).Return(firstBatch, nil).Once()
	mockDb.EXPECT().MarkExpiredEvents(ctx, 100).Return(nil, errors.New("database connection failed")).Once()

	// Should notify events from first batch only
	for _, event := range firstBatch {
		mockNotifier.EXPECT().EventExpired(event.UserId, event.EventId).Return().Once()
	}

	worker := NewExpirationWorker(mockDb, mockNotifier)
	worker.processExpiredEvents(ctx)

	// Expectations are automatically verified by mockery
}

func TestProcessExpiredEvents_ExactlyBatchSizeThenEmpty(t *testing.T) {
	ctx := context.Background()

	mockDb := mocks.NewMockExpirationDb(t)
	mockNotifier := mocks.NewMockExpirationNotifier(t)

	// Generate exactly 100 events (batch size)
	batch := make([]db.ExpiredEventInfo, 100)
	for i := 0; i < 100; i++ {
		batch[i] = db.ExpiredEventInfo{
			EventId: "event_" + string(rune('a'+i%26)),
			UserId:  "user_1",
		}
	}

	// First call returns full batch, second returns empty (no more events)
	mockDb.EXPECT().MarkExpiredEvents(ctx, 100).Return(batch, nil).Once()
	mockDb.EXPECT().MarkExpiredEvents(ctx, 100).Return([]db.ExpiredEventInfo{}, nil).Once()

	// Should notify all events
	for _, event := range batch {
		mockNotifier.EXPECT().EventExpired(event.UserId, event.EventId).Return().Once()
	}

	worker := NewExpirationWorker(mockDb, mockNotifier)
	worker.processExpiredEvents(ctx)

	// Expectations are automatically verified by mockery
}
