package notifications

import (
	"context"
	"log/slog"

	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

type Sender interface {
	Send(ctx context.Context, notification *db.NotificationQueueRow) error
}

// SpecificSender handles a single delivery method (email, SMS, etc.)
type SpecificSender interface {
	Send(ctx context.Context, address, topic, message string) error
	GetDeliveryMethod() string
}

type LogSender struct {
	logger *slog.Logger
}

func NewLogSender() *LogSender {
	return &LogSender{
		logger: slog.Default(),
	}
}

func (s *LogSender) Send(ctx context.Context, notification *db.NotificationQueueRow) error {
	logCtx := s.logger.With(
		"notificationId", notification.Id,
		"userId", notification.UserId,
		"topic", notification.Data.Topic,
		"email", notification.UserPreferences.Notifications.Email,
		"phone", notification.UserPreferences.Notifications.PhoneNumber,
	)

	logCtx.Info("📧 NOTIFICATION SENT", "message", notification.Data.Message)
	return nil
}

// EmailSender handles email notifications
type EmailSender struct {
	logger *slog.Logger
}

func NewEmailSender() *EmailSender {
	return &EmailSender{
		logger: slog.Default(),
	}
}

func (s *EmailSender) Send(ctx context.Context, address, topic, message string) error {
	if address == "" {
		return nil // Skip if no email address
	}

	logCtx := s.logger.With(
		"deliveryMethod", "email",
		"address", address,
		"topic", topic,
	)

	logCtx.Info("📧 EMAIL SENT", "message", message)
	return nil
}

func (s *EmailSender) GetDeliveryMethod() string {
	return "email"
}

// SMSSender handles SMS notifications
type SMSSender struct {
	logger *slog.Logger
}

func NewSMSSender() *SMSSender {
	return &SMSSender{
		logger: slog.Default(),
	}
}

func (s *SMSSender) Send(ctx context.Context, address, topic, message string) error {
	if address == "" {
		return nil // Skip if no phone number
	}

	logCtx := s.logger.With(
		"deliveryMethod", "sms",
		"address", address,
		"topic", topic,
	)

	logCtx.Info("📱 SMS SENT", "message", message)
	return nil
}

func (s *SMSSender) GetDeliveryMethod() string {
	return "sms"
}

type FanOutSender struct {
	specificSenders []SpecificSender
	logger          *slog.Logger
}

func NewFanOutSender(senders ...SpecificSender) *FanOutSender {
	return &FanOutSender{
		specificSenders: senders,
		logger:          slog.Default(),
	}
}

func (f *FanOutSender) Send(ctx context.Context, notification *db.NotificationQueueRow) error {
	userPrefs := notification.UserPreferences.Notifications

	logCtx := f.logger.With(
		"notificationId", notification.Id,
		"userId", notification.UserId,
		"topic", notification.Data.Topic,
	)

	sentCount := 0

	for _, sender := range f.specificSenders {
		var address string

		switch sender.GetDeliveryMethod() {
		case "email":
			address = userPrefs.Email
		case "sms":
			address = userPrefs.PhoneNumber
		case "debug":
			address = userPrefs.DebugAddress
		default:
			logCtx.Warn("Unknown delivery method", "method", sender.GetDeliveryMethod())
			continue
		}

		if address != "" {
			if err := sender.Send(ctx, address, notification.Data.Topic, notification.Data.Message); err != nil {
				logCtx.Error("Failed to send notification via specific sender",
					"error", err,
					"deliveryMethod", sender.GetDeliveryMethod(),
					"address", address)
				return err
			}
			sentCount++
		} else {
			logCtx.Debug("Skipping delivery method - no address configured",
				"deliveryMethod", sender.GetDeliveryMethod())
		}
	}

	if sentCount == 0 {
		logCtx.Warn("No notifications sent - no valid addresses found")
	} else {
		logCtx.Info("Notification sent successfully", "deliveryMethods", sentCount)
	}

	return nil
}
