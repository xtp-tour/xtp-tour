package notifications

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/wneessen/go-mail"
	"github.com/wneessen/go-mail/smtp"

	"github.com/xtp-tour/xtp-tour/api/pkg"
)

// EmailSender handles email notifications via SMTP with connection pooling
type EmailSender struct {
	config     pkg.EmailConfig
	logger     *slog.Logger
	client     *mail.Client
	enabled    bool
	smtpConn   *smtp.Client
	connMutex  sync.Mutex
	maxRetries int
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

	// Validate required configuration fields
	var missing []string
	if config.Username == "" {
		missing = append(missing, "EMAIL_USERNAME")
	}
	if config.Password == "" {
		missing = append(missing, "EMAIL_PASSWORD")
	}
	if config.From == "" {
		missing = append(missing, "EMAIL_FROM")
	}
	if len(missing) > 0 {
		return nil, fmt.Errorf("email configuration incomplete: missing environment variables: %s", missing)
	}

	// Create SMTP client with mandatory TLS/STARTTLS for security
	client, err := mail.NewClient(
		config.SmtpHost,
		mail.WithPort(config.Port),
		mail.WithSMTPAuth(mail.SMTPAuthPlain),
		mail.WithTLSPortPolicy(mail.TLSMandatory), // Require TLS encryption
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
		config:     config,
		logger:     logger,
		client:     client,
		enabled:    true,
		maxRetries: 2, // Retry once on connection failure
	}, nil
}

// getOrCreateConnection returns an existing SMTP connection or creates a new one
func (s *EmailSender) getOrCreateConnection(ctx context.Context) (*smtp.Client, error) {
	s.connMutex.Lock()
	defer s.connMutex.Unlock()

	// Check if we have an existing connection
	if s.smtpConn != nil {
		// Test if connection is still alive with Noop
		if err := s.smtpConn.Noop(); err == nil {
			return s.smtpConn, nil
		}
		// Connection is dead, close it
		s.logger.Debug("SMTP connection lost, reconnecting")
		_ = s.smtpConn.Close()
		s.smtpConn = nil
	}

	// Create new connection
	conn, err := s.client.DialToSMTPClientWithContext(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to dial SMTP server: %w", err)
	}

	s.smtpConn = conn
	s.logger.Debug("New SMTP connection established")
	return conn, nil
}

// Close closes the persistent SMTP connection if open
func (s *EmailSender) Close() error {
	s.connMutex.Lock()
	defer s.connMutex.Unlock()

	if s.smtpConn != nil {
		err := s.smtpConn.Close()
		s.smtpConn = nil
		return err
	}
	return nil
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
	)

	// Create email message
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

	// Send with retry logic using persistent connection
	var lastErr error
	for attempt := 0; attempt <= s.maxRetries; attempt++ {
		if attempt > 0 {
			logCtx.Debug("Retrying email send", "attempt", attempt)
		}

		// Get or create connection
		conn, err := s.getOrCreateConnection(ctx)
		if err != nil {
			lastErr = err
			continue
		}

		// Send using the persistent connection
		if err := s.client.SendWithSMTPClient(conn, m); err != nil {
			lastErr = fmt.Errorf("failed to send email: %w", err)
			// Mark connection as invalid on send error
			s.connMutex.Lock()
			if s.smtpConn != nil {
				_ = s.smtpConn.Close()
				s.smtpConn = nil
			}
			s.connMutex.Unlock()
			continue
		}

		logCtx.Info("📧 Email sent successfully via SMTP")
		return nil
	}

	logCtx.Error("Failed to send email after retries", "error", lastErr, "attempts", s.maxRetries+1)
	return fmt.Errorf("failed to send email to %s after %d attempts: %w", address, s.maxRetries+1, lastErr)
}

func (s *EmailSender) GetDeliveryMethod() string {
	return "email"
}
