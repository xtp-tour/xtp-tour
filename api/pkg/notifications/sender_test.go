package notifications

import (
	"context"
	"testing"

	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

func TestFanOutSender_WithChannelPreferences(t *testing.T) {
	// Create test senders
	emailSender := NewEmailSender()
	smsSender := NewSMSSender()
	debugSender := NewDebugSender()

	// Create fan-out sender
	fanOutSender := NewFanOutSender(emailSender, smsSender, debugSender)

	// Test notification with only email enabled
	notification := &db.NotificationQueueRow{
		Id:     "test-1",
		UserId: "user-1",
		Data: db.NotificationQueueData{
			Topic:   "test",
			Message: "Test message",
		},
		UserPreferences: db.UserPreferences{
			Notifications: db.NotificationSettings{
				Email:        "test@example.com",
				PhoneNumber:  "1234567890",
				DebugAddress: "debug@example.com",
				Channels:     db.NotificationChannelEmail, // Only email enabled
			},
		},
	}

	// This should only send via email since only email channel is enabled
	err := fanOutSender.Send(context.Background(), notification)
	if err != nil {
		t.Errorf("Failed to send notification: %v", err)
	}
}

func TestFanOutSender_WithMultipleChannelsEnabled(t *testing.T) {
	// Create test senders
	emailSender := NewEmailSender()
	smsSender := NewSMSSender()
	debugSender := NewDebugSender()

	// Create fan-out sender
	fanOutSender := NewFanOutSender(emailSender, smsSender, debugSender)

	// Test notification with email and SMS enabled
	notification := &db.NotificationQueueRow{
		Id:     "test-2",
		UserId: "user-2",
		Data: db.NotificationQueueData{
			Topic:   "test",
			Message: "Test message",
		},
		UserPreferences: db.UserPreferences{
			Notifications: db.NotificationSettings{
				Email:        "test@example.com",
				PhoneNumber:  "1234567890",
				DebugAddress: "debug@example.com",
				Channels:     db.NotificationChannelEmail | db.NotificationChannelSMS, // Email and SMS enabled
			},
		},
	}

	// This should send via both email and SMS
	err := fanOutSender.Send(context.Background(), notification)
	if err != nil {
		t.Errorf("Failed to send notification: %v", err)
	}
}

func TestFanOutSender_WithNoChannelsEnabled(t *testing.T) {
	// Create test senders
	emailSender := NewEmailSender()
	smsSender := NewSMSSender()
	debugSender := NewDebugSender()

	// Create fan-out sender
	fanOutSender := NewFanOutSender(emailSender, smsSender, debugSender)

	// Test notification with no channels enabled
	notification := &db.NotificationQueueRow{
		Id:     "test-3",
		UserId: "user-3",
		Data: db.NotificationQueueData{
			Topic:   "test",
			Message: "Test message",
		},
		UserPreferences: db.UserPreferences{
			Notifications: db.NotificationSettings{
				Email:        "test@example.com",
				PhoneNumber:  "1234567890",
				DebugAddress: "debug@example.com",
				Channels:     0, // No channels enabled
			},
		},
	}

	// This should not send any notifications
	err := fanOutSender.Send(context.Background(), notification)
	if err != nil {
		t.Errorf("Failed to send notification: %v", err)
	}
}
