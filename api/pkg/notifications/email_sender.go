package notifications

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/wneessen/go-mail"

	"github.com/xtp-tour/xtp-tour/api/pkg"
)

// EmailSender handles email notifications via SMTP
type EmailSender struct {
	config  pkg.EmailConfig
	logger  *slog.Logger
	client  *mail.Client
	enabled bool
}

func NewEmailSender() *EmailSender {
	return &EmailSender{
		logger:  slog.Default(),
		enabled: false,
	}
}

func NewRealEmailSender(config pkg.EmailConfig, logger *slog.Logger) (*EmailSender, error) {
	if !config.Enabled {
		logger.Info("Email notifications disabled")
		return &EmailSender{
			config:  config,
			logger:  logger,
			enabled: false,
		}, nil
	}

	if config.Username == "" || config.Password == "" || config.From == "" {
		return nil, fmt.Errorf("email configuration incomplete: username, password, and from address are required")
	}

	// Create SMTP client similar to nodemailer.createTransport
	client, err := mail.NewClient(
		config.SmtpHost,
		mail.WithPort(config.Port),
		mail.WithSMTPAuth(mail.SMTPAuthPlain),
		mail.WithUsername(config.Username),
		mail.WithPassword(config.Password),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create email client: %w", err)
	}

	logger.Info("SMTP service initialized successfully",
		"host", config.SmtpHost,
		"port", config.Port,
		"from", config.From)

	return &EmailSender{
		config:  config,
		logger:  logger,
		client:  client,
		enabled: true,
	}, nil
}

func (s *EmailSender) Send(ctx context.Context, address, topic, message string) error {
	if !s.enabled {
		s.logger.Debug("Email sending disabled, skipping", "address", address)
		return nil
	}

	if address == "" {
		s.logger.Debug("No email address provided, skipping")
		return nil
	}

	logCtx := s.logger.With(
		"deliveryMethod", "email",
		"address", address,
		"topic", topic,
		"from", s.config.From,
	)

	// Create email message similar to mailOptions in nodemailer
	m := mail.NewMsg()
	if err := m.From(s.config.From); err != nil {
		logCtx.Error("Failed to set From address", "error", err)
		return fmt.Errorf("failed to set from address: %w", err)
	}
	if err := m.To(address); err != nil {
		logCtx.Error("Failed to set To address", "error", err)
		return fmt.Errorf("failed to set to address: %w", err)
	}
	m.Subject(topic)
	m.SetBodyString(mail.TypeTextHTML, message)

	// Send email using SMTP client with context support
	if err := s.client.DialAndSendWithContext(ctx, m); err != nil {
		logCtx.Error("Failed to send email via SMTP", "error", err)
		return fmt.Errorf("failed to send email to %s: %w", address, err)
	}

	logCtx.Info("📧 Email sent successfully via SMTP")
	return nil
}

func (s *EmailSender) GetDeliveryMethod() string {
	return "email"
}
