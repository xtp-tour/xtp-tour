package email

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/wneessen/go-mail"
	"github.com/wneessen/go-mail/smtp"

	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

// Sender handles email notifications via SMTP with connection pooling and template rendering
type Sender struct {
	config           pkg.EmailConfig
	logger           *slog.Logger
	client           *mail.Client
	templateRenderer *TemplateRenderer
	enabled          bool
	smtpConn         *smtp.Client
	connMutex        sync.Mutex
	maxRetries       int
}

func NewSender(config pkg.EmailConfig, logger *slog.Logger) (*Sender, error) {
	if !config.Enabled {
		logger.Info("Email notifications disabled")
		return &Sender{
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

	// Create template renderer if domain is configured
	var templateRenderer *TemplateRenderer
	if config.DomainName != "" {
		templateRenderer, err = NewTemplateRenderer(config.DomainName)
		if err != nil {
			logger.Warn("Failed to create email template renderer, will use plain text", "error", err)
		}
	}

	logger.Info("SMTP service initialized successfully",
		"host", config.SmtpHost,
		"port", config.Port,
		"from", config.From,
		"templatesEnabled", templateRenderer != nil)

	return &Sender{
		config:           config,
		logger:           logger,
		client:           client,
		templateRenderer: templateRenderer,
		enabled:          true,
		maxRetries:       2, // Retry once on connection failure
	}, nil
}

// getOrCreateConnection returns an existing SMTP connection or creates a new one
func (s *Sender) getOrCreateConnection(ctx context.Context) (*smtp.Client, error) {
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
func (s *Sender) Close() error {
	s.connMutex.Lock()
	defer s.connMutex.Unlock()

	if s.smtpConn != nil {
		err := s.smtpConn.Close()
		s.smtpConn = nil
		return err
	}
	return nil
}

// IsEnabled returns whether email sending is enabled
func (s *Sender) IsEnabled() bool {
	return s.enabled
}

func (s *Sender) Send(ctx context.Context, address, topic, message string) error {
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

func (s *Sender) GetDeliveryMethod() uint8 {
	return db.NotificationChannelEmail
}

// SendNotification sends a notification using templates if available, otherwise plain text
func (s *Sender) SendNotification(ctx context.Context, address string, data db.NotificationQueueData) error {
	if !s.enabled {
		s.logger.Debug("Email sending disabled, skipping", "address", address)
		return nil
	}

	if address == "" {
		s.logger.Debug("No email address provided, skipping")
		return nil
	}

	// Try to render with template if available
	if s.templateRenderer != nil && data.TemplateType != "" {
		rendered, err := s.renderTemplate(data)
		if err != nil {
			s.logger.Warn("Failed to render email template, falling back to plain text",
				"error", err,
				"templateType", data.TemplateType)
		} else if rendered != nil {
			return s.sendRendered(ctx, address, rendered)
		}
	}

	// Fallback to plain text
	return s.Send(ctx, address, data.Topic, data.Message)
}

// renderTemplate renders the appropriate template based on notification data
func (s *Sender) renderTemplate(data db.NotificationQueueData) (*RenderedEmail, error) {
	switch data.TemplateType {
	case "event_confirmed":
		return s.renderEventConfirmed(data.TemplateData)
	case "user_joined":
		return s.renderUserJoined(data.TemplateData)
	case "event_expired":
		return s.renderEventExpired(data.TemplateData)
	default:
		return nil, nil
	}
}

func (s *Sender) renderEventConfirmed(data map[string]interface{}) (*RenderedEmail, error) {
	templateData := EventConfirmedData{
		RecipientName: getStringFromMap(data, "RecipientName"),
		IsHost:        getBoolFromMap(data, "IsHost"),
		HostName:      getStringFromMap(data, "HostName"),
		DateTime:      getStringFromMap(data, "DateTime"),
		Location:      getStringFromMap(data, "Location"),
		EventId:       getStringFromMap(data, "EventId"),
	}
	if players, ok := data["ConfirmedPlayers"].([]interface{}); ok {
		for _, p := range players {
			if str, ok := p.(string); ok {
				templateData.ConfirmedPlayers = append(templateData.ConfirmedPlayers, str)
			}
		}
	}
	return s.templateRenderer.RenderEventConfirmed(templateData)
}

func (s *Sender) renderUserJoined(data map[string]interface{}) (*RenderedEmail, error) {
	templateData := UserJoinedData{
		HostName:    getStringFromMap(data, "HostName"),
		JoiningUser: getStringFromMap(data, "JoiningUser"),
		Comment:     getStringFromMap(data, "Comment"),
		EventId:     getStringFromMap(data, "EventId"),
	}
	return s.templateRenderer.RenderUserJoined(templateData)
}

func (s *Sender) renderEventExpired(data map[string]interface{}) (*RenderedEmail, error) {
	templateData := EventExpiredData{
		RecipientName: getStringFromMap(data, "RecipientName"),
		EventId:       getStringFromMap(data, "EventId"),
	}
	return s.templateRenderer.RenderEventExpired(templateData)
}

func getStringFromMap(m map[string]interface{}, key string) string {
	if v, ok := m[key]; ok {
		if str, ok := v.(string); ok {
			return str
		}
	}
	return ""
}

func getBoolFromMap(m map[string]interface{}, key string) bool {
	if v, ok := m[key]; ok {
		if b, ok := v.(bool); ok {
			return b
		}
	}
	return false
}

// sendRendered sends a rendered email with both HTML and plain text parts
func (s *Sender) sendRendered(ctx context.Context, address string, rendered *RenderedEmail) error {
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
		"subject", rendered.Subject,
	)

	// Create email message with multipart body
	m := mail.NewMsg()
	if err := m.From(s.config.From); err != nil {
		logCtx.Error("Failed to set From address", "error", err)
		return fmt.Errorf("failed to set from address: %w", err)
	}
	if err := m.To(address); err != nil {
		logCtx.Error("Failed to set To address", "error", err)
		return fmt.Errorf("failed to set to address: %w", err)
	}
	m.Subject(rendered.Subject)

	// Set plain text body first (as fallback)
	m.SetBodyString(mail.TypeTextPlain, rendered.PlainBody)
	// Add HTML as alternative part
	m.AddAlternativeString(mail.TypeTextHTML, rendered.HTMLBody)

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
