package notifications

import (
	"context"
	"log/slog"
	"testing"

	"github.com/xtp-tour/xtp-tour/api/pkg/api"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

// Simple mock implementations for testing
type MockNotifierDb struct {
	GetUsersNotificationSettingsFunc func(eventId string) (map[string]db.EventNotifSettingsResult, error)
	GetUserNamesFunc                 func(ctx context.Context, userIds []string) (map[string]string, error)
	GetFacilityNameFunc              func(ctx context.Context, facilityId string) (string, error)
	GetEventOwnerFunc                func(ctx context.Context, eventId string) (string, error)
}

func (m *MockNotifierDb) GetUsersNotificationSettings(eventId string) (map[string]db.EventNotifSettingsResult, error) {
	if m.GetUsersNotificationSettingsFunc != nil {
		return m.GetUsersNotificationSettingsFunc(eventId)
	}
	return nil, nil
}

func (m *MockNotifierDb) GetUserNames(ctx context.Context, userIds []string) (map[string]string, error) {
	if m.GetUserNamesFunc != nil {
		return m.GetUserNamesFunc(ctx, userIds)
	}
	return nil, nil
}

func (m *MockNotifierDb) GetFacilityName(ctx context.Context, facilityId string) (string, error) {
	if m.GetFacilityNameFunc != nil {
		return m.GetFacilityNameFunc(ctx, facilityId)
	}
	return "", nil
}

func (m *MockNotifierDb) GetEventOwner(ctx context.Context, eventId string) (string, error) {
	if m.GetEventOwnerFunc != nil {
		return m.GetEventOwnerFunc(ctx, eventId)
	}
	return "", nil
}

type MockQueue struct {
	EnqueueFunc             func(ctx context.Context, userId string, data db.NotificationQueueData) error
	GetNextFunc             func(ctx context.Context) (*db.NotificationQueueRow, error)
	MarkCompletedFunc       func(ctx context.Context, id string) error
	MarkFailedFunc          func(ctx context.Context, id string) error
	IncrementRetryCountFunc func(ctx context.Context, id string) error
}

func (m *MockQueue) Enqueue(ctx context.Context, userId string, data db.NotificationQueueData) error {
	if m.EnqueueFunc != nil {
		return m.EnqueueFunc(ctx, userId, data)
	}
	return nil
}

func (m *MockQueue) GetNext(ctx context.Context) (*db.NotificationQueueRow, error) {
	if m.GetNextFunc != nil {
		return m.GetNextFunc(ctx)
	}
	return nil, nil
}

func (m *MockQueue) MarkCompleted(ctx context.Context, id string) error {
	if m.MarkCompletedFunc != nil {
		return m.MarkCompletedFunc(ctx, id)
	}
	return nil
}

func (m *MockQueue) MarkFailed(ctx context.Context, id string) error {
	if m.MarkFailedFunc != nil {
		return m.MarkFailedFunc(ctx, id)
	}
	return nil
}

func (m *MockQueue) IncrementRetryCount(ctx context.Context, id string) error {
	if m.IncrementRetryCountFunc != nil {
		return m.IncrementRetryCountFunc(ctx, id)
	}
	return nil
}

func Test_UserJoined_Success(t *testing.T) {
	// Setup
	mockDb := new(MockNotifierDb)
	mockQueue := new(MockQueue)
	notifier := NewNotifier(mockDb, mockQueue)

	joiningUserId := "user_123"
	eventOwnerId := "owner_456"
	eventId := "event_789"

	joinRequest := api.JoinRequestData{
		Id:        "join_req_123",
		EventId:   eventId,
		Comment:   "I'd love to join this event!",
		Locations: []string{"location_1"},
		TimeSlots: []string{"2024-01-01T10:00:00Z"},
	}

	var enqueuedNotification db.NotificationQueueData
	var enqueuedUserId string

	// Mock expectations
	mockDb.GetEventOwnerFunc = func(ctx context.Context, eventId string) (string, error) {
		return eventOwnerId, nil
	}
	mockDb.GetUserNamesFunc = func(ctx context.Context, userIds []string) (map[string]string, error) {
		return map[string]string{
			joiningUserId: "John Doe",
			eventOwnerId:  "Jane Smith",
		}, nil
	}
	mockQueue.EnqueueFunc = func(ctx context.Context, userId string, data db.NotificationQueueData) error {
		enqueuedUserId = userId
		enqueuedNotification = data
		return nil
	}

	// Execute
	notifier.UserJoined(testLogger(t), joiningUserId, joinRequest)

	// Verify
	expectedMessage := "Hello! John Doe has requested to join your event. They left a comment: \"I'd love to join this event!\""
	if enqueuedUserId != eventOwnerId {
		t.Errorf("Expected to enqueue for owner %s, got %s", eventOwnerId, enqueuedUserId)
	}
	if enqueuedNotification.Topic != "New Join Request" {
		t.Errorf("Expected topic 'New Join Request', got '%s'", enqueuedNotification.Topic)
	}
	if enqueuedNotification.Message != expectedMessage {
		t.Errorf("Expected message '%s', got '%s'", expectedMessage, enqueuedNotification.Message)
	}
}

func Test_UserJoined_WithoutComment(t *testing.T) {
	// Setup
	mockDb := new(MockNotifierDb)
	mockQueue := new(MockQueue)
	notifier := NewNotifier(mockDb, mockQueue)

	joiningUserId := "user_123"
	eventOwnerId := "owner_456"
	eventId := "event_789"

	joinRequest := api.JoinRequestData{
		Id:        "join_req_123",
		EventId:   eventId,
		Comment:   "", // No comment
		Locations: []string{"location_1"},
		TimeSlots: []string{"2024-01-01T10:00:00Z"},
	}

	var enqueuedNotification db.NotificationQueueData
	var enqueuedUserId string

	// Mock expectations
	mockDb.GetEventOwnerFunc = func(ctx context.Context, eventId string) (string, error) {
		return eventOwnerId, nil
	}
	mockDb.GetUserNamesFunc = func(ctx context.Context, userIds []string) (map[string]string, error) {
		return map[string]string{
			joiningUserId: "John Doe",
			eventOwnerId:  "Jane Smith",
		}, nil
	}
	mockQueue.EnqueueFunc = func(ctx context.Context, userId string, data db.NotificationQueueData) error {
		enqueuedUserId = userId
		enqueuedNotification = data
		return nil
	}

	// Execute
	notifier.UserJoined(testLogger(t), joiningUserId, joinRequest)

	// Verify
	expectedMessage := "Hello! John Doe has requested to join your event."
	if enqueuedUserId != eventOwnerId {
		t.Errorf("Expected to enqueue for owner %s, got %s", eventOwnerId, enqueuedUserId)
	}
	if enqueuedNotification.Message != expectedMessage {
		t.Errorf("Expected message '%s', got '%s'", expectedMessage, enqueuedNotification.Message)
	}
}

func Test_UserJoined_UnknownUserName(t *testing.T) {
	// Setup
	mockDb := new(MockNotifierDb)
	mockQueue := new(MockQueue)
	notifier := NewNotifier(mockDb, mockQueue)

	joiningUserId := "user_123"
	eventOwnerId := "owner_456"
	eventId := "event_789"

	joinRequest := api.JoinRequestData{
		Id:        "join_req_123",
		EventId:   eventId,
		Comment:   "I'd love to join!",
		Locations: []string{"location_1"},
		TimeSlots: []string{"2024-01-01T10:00:00Z"},
	}

	var enqueuedNotification db.NotificationQueueData

	// Mock expectations - joining user name not found
	mockDb.GetEventOwnerFunc = func(ctx context.Context, eventId string) (string, error) {
		return eventOwnerId, nil
	}
	mockDb.GetUserNamesFunc = func(ctx context.Context, userIds []string) (map[string]string, error) {
		return map[string]string{
			// joiningUserId: "", // Not found
			eventOwnerId: "Jane Smith",
		}, nil
	}
	mockQueue.EnqueueFunc = func(ctx context.Context, userId string, data db.NotificationQueueData) error {
		enqueuedNotification = data
		return nil
	}

	// Execute
	notifier.UserJoined(testLogger(t), joiningUserId, joinRequest)

	// Verify
	expectedMessage := "Hello! A user has requested to join your event. They left a comment: \"I'd love to join!\""
	if enqueuedNotification.Message != expectedMessage {
		t.Errorf("Expected message '%s', got '%s'", expectedMessage, enqueuedNotification.Message)
	}
}

func Test_UserJoined_WithEventId(t *testing.T) {
	// This test verifies that the eventId is properly set on the joinRequest
	// before being passed to UserJoined (fixing the "Event not found" error)

	mockDb := new(MockNotifierDb)
	mockQueue := new(MockQueue)
	notifier := NewNotifier(mockDb, mockQueue)

	joiningUserId := "user_123"
	eventOwnerId := "owner_456"
	eventId := "63d0fe47-8bd7-4f86-b152-98d2928991c7" // Real eventId from the error log

	joinRequest := api.JoinRequestData{
		Id:        "join_req_123",
		EventId:   eventId, // This should be set from req.EventId in router
		Comment:   "Test comment",
		Locations: []string{"location_1"},
		TimeSlots: []string{"2024-01-01T10:00:00Z"},
	}

	var capturedEventId string
	mockDb.GetEventOwnerFunc = func(ctx context.Context, eventId string) (string, error) {
		capturedEventId = eventId
		return eventOwnerId, nil
	}
	mockDb.GetUserNamesFunc = func(ctx context.Context, userIds []string) (map[string]string, error) {
		return map[string]string{
			joiningUserId: "John Doe",
			eventOwnerId:  "Jane Smith",
		}, nil
	}
	mockQueue.EnqueueFunc = func(ctx context.Context, userId string, data db.NotificationQueueData) error {
		return nil
	}

	// Execute
	notifier.UserJoined(testLogger(t), joiningUserId, joinRequest)

	// Verify that GetEventOwner was called with the correct eventId
	if capturedEventId != eventId {
		t.Errorf("Expected GetEventOwner to be called with eventId '%s', got '%s'", eventId, capturedEventId)
	}
	if capturedEventId == "" {
		t.Error("GetEventOwner was called with empty eventId - this causes 'Event not found' error")
	}
}

// Helper function to create a test logger
func testLogger(t *testing.T) slog.Logger {
	// This is a simple implementation for testing
	// In a real scenario, you might want to use a more sophisticated logger setup
	return *slog.Default()
}
