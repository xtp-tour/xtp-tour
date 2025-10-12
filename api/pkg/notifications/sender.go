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
		var channelEnabled bool

		switch sender.GetDeliveryMethod() {
		case "email":
			address = userPrefs.Email
			channelEnabled = userPrefs.IsChannelEnabled(db.NotificationChannelEmail)
		case "sms":
			address = userPrefs.PhoneNumber
			channelEnabled = userPrefs.IsChannelEnabled(db.NotificationChannelSMS)
		case "debug":
			address = userPrefs.DebugAddress
			channelEnabled = userPrefs.IsChannelEnabled(db.NotificationChannelDebug)
		default:
			logCtx.Warn("Unknown delivery method", "method", sender.GetDeliveryMethod())
			continue
		}

		// Only send if channel is enabled AND address is configured
		if channelEnabled && address != "" {
			if err := sender.Send(ctx, address, notification.Data.Topic, notification.Data.Message); err != nil {
				logCtx.Error("Failed to send notification via specific sender",
					"error", err,
					"deliveryMethod", sender.GetDeliveryMethod(),
					"address", address)
				return err
			}
			sentCount++
		} else {
			if !channelEnabled {
				logCtx.Debug("Skipping delivery method - channel not enabled",
					"deliveryMethod", sender.GetDeliveryMethod())
			} else {
				logCtx.Debug("Skipping delivery method - no address configured",
					"deliveryMethod", sender.GetDeliveryMethod())
			}
		}
	}

	if sentCount == 0 {
		logCtx.Warn("No notifications sent - no valid addresses found")
	} else {
		logCtx.Info("Notification sent successfully", "deliveryMethods", sentCount)
	}

	return nil
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
		s.logger.Debug("No phone number provided, skipping SMS")
		return nil
	}

	s.logger.Info("📱 SMS sending not implemented yet",
		"deliveryMethod", "sms",
		"address", address,
		"topic", topic,
	)
	return nil
}

func (s *SMSSender) GetDeliveryMethod() string {
	return "sms"
}

// DebugSender handles debug notifications (logging)
type DebugSender struct {
	logger *slog.Logger
}

func NewDebugSender() *DebugSender {
	return &DebugSender{
		logger: slog.Default(),
	}
}

func (s *DebugSender) Send(ctx context.Context, address, topic, message string) error {
	if address == "" {
		s.logger.Debug("No debug address provided, skipping debug notification")
		return nil
	}

	s.logger.Info("🐛 Debug notification",
		"deliveryMethod", "debug",
		"address", address,
		"topic", topic,
		"message", message,
	)
	return nil
}

func (s *DebugSender) GetDeliveryMethod() string {
	return "debug"
}
