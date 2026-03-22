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
	GetBatchFunc            func(ctx context.Context, batchSize int) ([]*db.NotificationQueueRow, error)
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

func (m *MockQueue) GetBatch(ctx context.Context, batchSize int) ([]*db.NotificationQueueRow, error) {
	if m.GetBatchFunc != nil {
		return m.GetBatchFunc(ctx, batchSize)
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

func Test_EventConfirmed_MultipleAcceptedPlayers(t *testing.T) {
	mockDb := new(MockNotifierDb)
	mockQueue := new(MockQueue)
	notifier := NewNotifier(mockDb, mockQueue)

	eventId := "event_multi"
	hostId := "host_1"
	player1 := "player_1"
	player2 := "player_2"
	player3 := "player_3"
	rejectedPlayer := "rejected_1"

	mockDb.GetUsersNotificationSettingsFunc = func(eid string) (map[string]db.EventNotifSettingsResult, error) {
		return map[string]db.EventNotifSettingsResult{
			hostId:         {UserId: hostId, IsHost: 1, IsAccepted: -1},
			player1:        {UserId: player1, IsHost: 0, IsAccepted: 1},
			player2:        {UserId: player2, IsHost: 0, IsAccepted: 1},
			player3:        {UserId: player3, IsHost: 0, IsAccepted: 1},
			rejectedPlayer: {UserId: rejectedPlayer, IsHost: 0, IsAccepted: 0},
		}, nil
	}
	mockDb.GetUserNamesFunc = func(ctx context.Context, userIds []string) (map[string]string, error) {
		return map[string]string{
			hostId:         "Host Name",
			player1:        "Player One",
			player2:        "Player Two",
			player3:        "Player Three",
			rejectedPlayer: "Rejected Player",
		}, nil
	}
	mockDb.GetFacilityNameFunc = func(ctx context.Context, facilityId string) (string, error) {
		return "Test Court", nil
	}

	var enqueuedUserIds []string
	var enqueuedData []db.NotificationQueueData
	mockQueue.EnqueueFunc = func(ctx context.Context, userId string, data db.NotificationQueueData) error {
		enqueuedUserIds = append(enqueuedUserIds, userId)
		enqueuedData = append(enqueuedData, data)
		return nil
	}

	logCtx := slog.With("test", true)
	notifier.EventConfirmed(logCtx, eventId, []string{"jr1", "jr2", "jr3"}, "2024-06-01T10:00:00Z", "loc1", hostId)

	// Should have 4 notifications: host + 3 accepted players (not the rejected one)
	if len(enqueuedUserIds) != 4 {
		t.Fatalf("Expected 4 notifications, got %d: %v", len(enqueuedUserIds), enqueuedUserIds)
	}

	// Rejected player should not be in the list
	for _, uid := range enqueuedUserIds {
		if uid == rejectedPlayer {
			t.Error("Rejected player should not receive a notification")
		}
	}

	// Verify host notification has ConfirmedPlayers list
	for i, uid := range enqueuedUserIds {
		if uid == hostId {
			isHost, ok := enqueuedData[i].TemplateData[TemplateDataKeys.IsHost]
			if !ok || isHost != true {
				t.Error("Host notification should have IsHost=true")
			}
			players, ok := enqueuedData[i].TemplateData[TemplateDataKeys.ConfirmedPlayers]
			if !ok {
				t.Fatal("Host notification should have ConfirmedPlayers")
			}
			playerList := players.([]string)
			if len(playerList) != 3 {
				t.Errorf("Expected 3 confirmed players, got %d", len(playerList))
			}
		}
	}
}

func Test_EventConfirmed_SinglePlayer(t *testing.T) {
	mockDb := new(MockNotifierDb)
	mockQueue := new(MockQueue)
	notifier := NewNotifier(mockDb, mockQueue)

	hostId := "host_1"
	playerId := "player_1"

	mockDb.GetUsersNotificationSettingsFunc = func(eid string) (map[string]db.EventNotifSettingsResult, error) {
		return map[string]db.EventNotifSettingsResult{
			hostId:   {UserId: hostId, IsHost: 1, IsAccepted: -1},
			playerId: {UserId: playerId, IsHost: 0, IsAccepted: 1},
		}, nil
	}
	mockDb.GetUserNamesFunc = func(ctx context.Context, userIds []string) (map[string]string, error) {
		return map[string]string{
			hostId:   "Host",
			playerId: "Player",
		}, nil
	}
	mockDb.GetFacilityNameFunc = func(ctx context.Context, facilityId string) (string, error) {
		return "Court", nil
	}

	var enqueuedUserIds []string
	mockQueue.EnqueueFunc = func(ctx context.Context, userId string, data db.NotificationQueueData) error {
		enqueuedUserIds = append(enqueuedUserIds, userId)
		return nil
	}

	logCtx := slog.With("test", true)
	notifier.EventConfirmed(logCtx, "event1", []string{"jr1"}, "2024-06-01T10:00:00Z", "loc1", hostId)

	if len(enqueuedUserIds) != 2 {
		t.Fatalf("Expected 2 notifications (host + 1 player), got %d", len(enqueuedUserIds))
	}
}

func Test_ChatMessagePosted_NotifiesAllParticipants(t *testing.T) {
	mockDb := new(MockNotifierDb)
	mockQueue := new(MockQueue)
	notifier := NewNotifier(mockDb, mockQueue)

	senderId := "sender_1"
	hostId := "host_1"
	player2 := "player_2"
	player3 := "player_3"
	nonAccepted := "non_accepted"

	mockDb.GetUsersNotificationSettingsFunc = func(eid string) (map[string]db.EventNotifSettingsResult, error) {
		return map[string]db.EventNotifSettingsResult{
			hostId:      {UserId: hostId, IsHost: 1, IsAccepted: -1},
			senderId:    {UserId: senderId, IsHost: 0, IsAccepted: 1},
			player2:     {UserId: player2, IsHost: 0, IsAccepted: 1},
			player3:     {UserId: player3, IsHost: 0, IsAccepted: 1},
			nonAccepted: {UserId: nonAccepted, IsHost: 0, IsAccepted: 0},
		}, nil
	}
	mockDb.GetUserNamesFunc = func(ctx context.Context, userIds []string) (map[string]string, error) {
		return map[string]string{senderId: "Sender Name"}, nil
	}

	var enqueuedUserIds []string
	mockQueue.EnqueueFunc = func(ctx context.Context, userId string, data db.NotificationQueueData) error {
		enqueuedUserIds = append(enqueuedUserIds, userId)
		return nil
	}

	notifier.ChatMessagePosted(senderId, "event1")

	// Should notify host + player2 + player3 = 3 (not sender, not non-accepted)
	if len(enqueuedUserIds) != 3 {
		t.Fatalf("Expected 3 notifications, got %d: %v", len(enqueuedUserIds), enqueuedUserIds)
	}
	for _, uid := range enqueuedUserIds {
		if uid == senderId {
			t.Error("Sender should not receive notification")
		}
		if uid == nonAccepted {
			t.Error("Non-accepted player should not receive notification")
		}
	}
}

// Helper function to create a test logger
func testLogger(t *testing.T) slog.Logger {
	return *slog.Default()
}
