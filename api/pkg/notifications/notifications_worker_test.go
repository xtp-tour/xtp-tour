package notifications

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/stretchr/testify/mock"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"github.com/xtp-tour/xtp-tour/api/pkg/notifications/mocks"
)

// Test that FanOutSender correctly routes to DebugSender when debug channel is enabled
func TestNotificationWorker_FanOutSender_DebugChannel(t *testing.T) {
	ctx := context.Background()

	// Create mockery mocks
	mockQueue := mocks.NewMockQueue(t)
	mockEmailSender := mocks.NewMockSpecificSender(t)
	mockDebugSender := mocks.NewMockSpecificSender(t)

	// Setup email sender mock
	mockEmailSender.On("GetDeliveryMethod").Return(uint8(db.NotificationChannelEmail))

	// Setup debug sender mock - it should be called
	mockDebugSender.On("GetDeliveryMethod").Return(uint8(db.NotificationChannelDebug))
	mockDebugSender.On("Send", ctx, "debug@test.com", "Test Topic", "Test Message").Return(nil).Once()

	// Create FanOutSender with both senders
	fanOutSender := NewFanOutSender(mockEmailSender, mockDebugSender)

	notification := &db.NotificationQueueRow{
		Id:     "notif_123",
		UserId: "user_456",
		Data: db.NotificationQueueData{
			Topic:   "Test Topic",
			Message: "Test Message",
		},
		Status:     db.NotificationStatusPending,
		RetryCount: 0,
		UserPreferences: db.UserPreferences{
			Notifications: db.NotificationSettings{
				DebugAddress: "debug@test.com",
				Channels:     db.NotificationChannelDebug, // Only debug enabled
			},
		},
	}

	// Setup queue mock - return notification once, then nil
	mockQueue.On("GetNext", ctx).Return(notification, nil).Once()
	mockQueue.On("GetNext", ctx).Return(nil, nil)
	mockQueue.On("MarkCompleted", ctx, "notif_123").Return(nil).Once()

	// Create notification worker
	config := pkg.NotificationConfig{
		MaxRetries:    3,
		TickerSeconds: 1,
	}
	worker := NewNotificationWorker(mockQueue, fanOutSender, config)

	// Process one notification
	worker.processNotifications(ctx)

	// All expectations are automatically verified by mockery
}

// Test that FanOutSender correctly routes to EmailSender when email channel is enabled
func TestNotificationWorker_FanOutSender_EmailChannel(t *testing.T) {
	ctx := context.Background()

	// Create mockery mocks
	mockQueue := mocks.NewMockQueue(t)
	mockEmailSender := mocks.NewMockSpecificSender(t)
	mockDebugSender := mocks.NewMockSpecificSender(t)

	// Setup email sender mock - it should be called
	mockEmailSender.On("GetDeliveryMethod").Return(uint8(db.NotificationChannelEmail))
	mockEmailSender.On("Send", ctx, "test@example.com", "Email Test Topic", "Email Test Message").Return(nil).Once()

	// Setup debug sender mock
	mockDebugSender.On("GetDeliveryMethod").Return(uint8(db.NotificationChannelDebug))

	// Create FanOutSender with both senders
	fanOutSender := NewFanOutSender(mockEmailSender, mockDebugSender)

	notification := &db.NotificationQueueRow{
		Id:     "notif_456",
		UserId: "user_789",
		Data: db.NotificationQueueData{
			Topic:   "Email Test Topic",
			Message: "Email Test Message",
		},
		Status:     db.NotificationStatusPending,
		RetryCount: 0,
		UserPreferences: db.UserPreferences{
			Notifications: db.NotificationSettings{
				Email:    "test@example.com",
				Channels: db.NotificationChannelEmail, // Only email enabled
			},
		},
	}

	// Setup queue mock
	mockQueue.On("GetNext", ctx).Return(notification, nil).Once()
	mockQueue.On("GetNext", ctx).Return(nil, nil)
	mockQueue.On("MarkCompleted", ctx, "notif_456").Return(nil).Once()

	// Create notification worker
	config := pkg.NotificationConfig{
		MaxRetries:    3,
		TickerSeconds: 1,
	}
	worker := NewNotificationWorker(mockQueue, fanOutSender, config)

	// Process notifications
	worker.processNotifications(ctx)

	// All expectations are automatically verified by mockery
}

// Test that FanOutSender routes to BOTH senders when multiple channels are enabled
func TestNotificationWorker_FanOutSender_MultipleChannels(t *testing.T) {
	ctx := context.Background()

	// Create mockery mocks
	mockQueue := mocks.NewMockQueue(t)
	mockEmailSender := mocks.NewMockSpecificSender(t)
	mockDebugSender := mocks.NewMockSpecificSender(t)

	// Setup email sender mock - it should be called
	mockEmailSender.On("GetDeliveryMethod").Return(uint8(db.NotificationChannelEmail))
	mockEmailSender.On("Send", ctx, "test@example.com", "Multi-channel Topic", "Multi-channel Message").Return(nil).Once()

	// Setup debug sender mock - it should be called
	mockDebugSender.On("GetDeliveryMethod").Return(uint8(db.NotificationChannelDebug))
	mockDebugSender.On("Send", ctx, "debug@test.com", "Multi-channel Topic", "Multi-channel Message").Return(nil).Once()

	// Create FanOutSender with both senders
	fanOutSender := NewFanOutSender(mockEmailSender, mockDebugSender)

	notification := &db.NotificationQueueRow{
		Id:     "notif_789",
		UserId: "user_123",
		Data: db.NotificationQueueData{
			Topic:   "Multi-channel Topic",
			Message: "Multi-channel Message",
		},
		Status:     db.NotificationStatusPending,
		RetryCount: 0,
		UserPreferences: db.UserPreferences{
			Notifications: db.NotificationSettings{
				Email:        "test@example.com",
				DebugAddress: "debug@test.com",
				Channels:     db.NotificationChannelEmail | db.NotificationChannelDebug, // Both enabled
			},
		},
	}

	// Setup queue mock
	mockQueue.On("GetNext", ctx).Return(notification, nil).Once()
	mockQueue.On("GetNext", ctx).Return(nil, nil)
	mockQueue.On("MarkCompleted", ctx, "notif_789").Return(nil).Once()

	// Create notification worker
	config := pkg.NotificationConfig{
		MaxRetries:    3,
		TickerSeconds: 1,
	}
	worker := NewNotificationWorker(mockQueue, fanOutSender, config)

	// Process notifications
	worker.processNotifications(ctx)

	// All expectations are automatically verified by mockery
}

// Test retry logic when sender fails
func TestNotificationWorker_RetryLogic(t *testing.T) {
	ctx := context.Background()

	// Create mockery mocks
	mockQueue := mocks.NewMockQueue(t)
	mockSender := mocks.NewMockSender(t)

	notification := &db.NotificationQueueRow{
		Id:     "notif_fail",
		UserId: "user_fail",
		Data: db.NotificationQueueData{
			Topic:   "Failing Topic",
			Message: "Failing Message",
		},
		Status:     db.NotificationStatusPending,
		RetryCount: 0,
		UserPreferences: db.UserPreferences{
			Notifications: db.NotificationSettings{
				Email:    "test@example.com",
				Channels: db.NotificationChannelEmail,
			},
		},
	}

	notification2 := &db.NotificationQueueRow{
		Id:     "notif_fail",
		UserId: "user_fail",
		Data: db.NotificationQueueData{
			Topic:   "Failing Topic",
			Message: "Failing Message",
		},
		Status:     db.NotificationStatusPending,
		RetryCount: 1,
		UserPreferences: db.UserPreferences{
			Notifications: db.NotificationSettings{
				Email:    "test@example.com",
				Channels: db.NotificationChannelEmail,
			},
		},
	}

	notification3 := &db.NotificationQueueRow{
		Id:     "notif_fail",
		UserId: "user_fail",
		Data: db.NotificationQueueData{
			Topic:   "Failing Topic",
			Message: "Failing Message",
		},
		Status:     db.NotificationStatusPending,
		RetryCount: 2,
		UserPreferences: db.UserPreferences{
			Notifications: db.NotificationSettings{
				Email:    "test@example.com",
				Channels: db.NotificationChannelEmail,
			},
		},
	}

	// Setup sender mock - always fails
	mockSender.On("Send", ctx, mock.Anything).Return(errors.New("intentional test failure"))

	// Create notification worker with max 2 retries
	config := pkg.NotificationConfig{
		MaxRetries:    2,
		TickerSeconds: 1,
	}
	worker := NewNotificationWorker(mockQueue, mockSender, config)

	// First call - should increment retry count
	mockQueue.On("GetNext", ctx).Return(notification, nil).Once()
	mockQueue.On("GetNext", ctx).Return(nil, nil).Once()
	mockQueue.On("IncrementRetryCount", ctx, "notif_fail").Return(nil).Once()
	worker.processNotifications(ctx)

	// Second call - should increment retry count again
	mockQueue.On("GetNext", ctx).Return(notification2, nil).Once()
	mockQueue.On("GetNext", ctx).Return(nil, nil).Once()
	mockQueue.On("IncrementRetryCount", ctx, "notif_fail").Return(nil).Once()
	worker.processNotifications(ctx)

	// Third call - should mark as failed (exceeded max retries)
	mockQueue.On("GetNext", ctx).Return(notification3, nil).Once()
	mockQueue.On("GetNext", ctx).Return(nil, nil).Once()
	mockQueue.On("MarkFailed", ctx, "notif_fail").Return(nil).Once()
	worker.processNotifications(ctx)

	// All expectations are automatically verified by mockery
}

// TestFanOutSender_RoutingLogic is a simple test that verifies the FanOut sender
// correctly routes notifications to the appropriate senders based on user preferences
func TestFanOutSender_RoutingLogic(t *testing.T) {
	ctx := context.Background()

	tests := []struct {
		name            string
		enabledChannels uint8
		emailAddress    string
		debugAddress    string
		expectEmailCall bool
		expectDebugCall bool
	}{
		{
			name:            "Email only",
			enabledChannels: db.NotificationChannelEmail,
			emailAddress:    "user@example.com",
			debugAddress:    "",
			expectEmailCall: true,
			expectDebugCall: false,
		},
		{
			name:            "Debug only",
			enabledChannels: db.NotificationChannelDebug,
			emailAddress:    "",
			debugAddress:    "debug@test.com",
			expectEmailCall: false,
			expectDebugCall: true,
		},
		{
			name:            "Both email and debug",
			enabledChannels: db.NotificationChannelEmail | db.NotificationChannelDebug,
			emailAddress:    "user@example.com",
			debugAddress:    "debug@test.com",
			expectEmailCall: true,
			expectDebugCall: true,
		},
		{
			name:            "No channels enabled",
			enabledChannels: 0,
			emailAddress:    "user@example.com",
			debugAddress:    "debug@test.com",
			expectEmailCall: false,
			expectDebugCall: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup: Create mock senders
			mockEmailSender := mocks.NewMockSpecificSender(t)
			mockDebugSender := mocks.NewMockSpecificSender(t)

			// Always setup GetDeliveryMethod calls
			mockEmailSender.On("GetDeliveryMethod").Return(uint8(db.NotificationChannelEmail))
			mockDebugSender.On("GetDeliveryMethod").Return(uint8(db.NotificationChannelDebug))

			// Setup Send expectations based on test case
			if tt.expectEmailCall {
				mockEmailSender.On("Send", ctx, tt.emailAddress, "Test Topic", "Test Message").Return(nil).Once()
			}
			if tt.expectDebugCall {
				mockDebugSender.On("Send", ctx, tt.debugAddress, "Test Topic", "Test Message").Return(nil).Once()
			}

			fanOutSender := NewFanOutSender(mockEmailSender, mockDebugSender)

			// Setup: Create notification with specified preferences
			notification := &db.NotificationQueueRow{
				Id:     "test_notif_123",
				UserId: "test_user_456",
				Data: db.NotificationQueueData{
					Topic:   "Test Topic",
					Message: "Test Message",
				},
				Status:     db.NotificationStatusPending,
				RetryCount: 0,
				UserPreferences: db.UserPreferences{
					Notifications: db.NotificationSettings{
						Email:        tt.emailAddress,
						DebugAddress: tt.debugAddress,
						Channels:     tt.enabledChannels,
					},
				},
			}

			// Execute: Send the notification
			err := fanOutSender.Send(ctx, notification)
			if err != nil {
				t.Fatalf("Unexpected error: %v", err)
			}

			// Expectations are automatically verified by mockery
		})
	}
}

// Test worker Start and Stop methods
func TestNotificationWorker_StartStop(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	mockQueue := mocks.NewMockQueue(t)
	mockSender := mocks.NewMockSender(t)

	// Setup mock to return no notifications
	mockQueue.On("GetNext", mock.Anything).Return(nil, nil).Maybe()

	config := pkg.NotificationConfig{
		MaxRetries:    3,
		TickerSeconds: 1,
	}
	worker := NewNotificationWorker(mockQueue, mockSender, config)

	// Start worker in goroutine
	go worker.Start(ctx)

	// Let it run briefly
	time.Sleep(100 * time.Millisecond)

	// Stop the worker
	worker.Stop()

	// Give it time to stop
	time.Sleep(100 * time.Millisecond)

	// Test passes if we get here without hanging
}
