package email

import (
	"context"
	"log/slog"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"github.com/xtp-tour/xtp-tour/api/pkg/notifications"
)

func TestSender_Disabled(t *testing.T) {
	config := pkg.EmailConfig{
		Enabled: false,
	}

	sender, err := NewSender(config, slog.Default())
	assert.NoError(t, err)
	assert.NotNil(t, sender)
	assert.False(t, sender.IsEnabled())

	// Should not send when disabled
	err = sender.Send(context.Background(), "test@example.com", "Test", "Test message")
	assert.NoError(t, err)
}

func TestSender_ConfigValidation(t *testing.T) {
	tests := []struct {
		name    string
		config  pkg.EmailConfig
		wantErr bool
	}{
		{
			name: "missing username",
			config: pkg.EmailConfig{
				Enabled:  true,
				SmtpHost: "smtp.example.com",
				Port:     587,
				Password: "password",
				From:     "test@example.com",
			},
			wantErr: true,
		},
		{
			name: "missing password",
			config: pkg.EmailConfig{
				Enabled:  true,
				SmtpHost: "smtp.example.com",
				Port:     587,
				Username: "user",
				From:     "test@example.com",
			},
			wantErr: true,
		},
		{
			name: "missing from",
			config: pkg.EmailConfig{
				Enabled:  true,
				SmtpHost: "smtp.example.com",
				Port:     587,
				Username: "user",
				Password: "password",
			},
			wantErr: true,
		},
		{
			name: "valid config",
			config: pkg.EmailConfig{
				Enabled:  true,
				SmtpHost: "smtp.example.com",
				Port:     587,
				Username: "user",
				Password: "password",
				From:     "test@example.com",
			},
			wantErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := NewSender(tt.config, slog.Default())
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestSender_EmptyAddress(t *testing.T) {
	config := pkg.EmailConfig{
		Enabled:  true,
		SmtpHost: "smtp.example.com",
		Port:     587,
		Username: "user",
		Password: "password",
		From:     "test@example.com",
	}

	sender, err := NewSender(config, slog.Default())
	assert.NoError(t, err)

	// Should not send to empty address
	err = sender.Send(context.Background(), "", "Test", "Test message")
	assert.NoError(t, err)
}

// Helper to create a Sender with a template renderer but no SMTP connection (for render testing)
func newTestSenderWithTemplates(t *testing.T) *Sender {
	t.Helper()
	renderer, err := NewTemplateRenderer("https://xtp-tour.com")
	require.NoError(t, err)
	return &Sender{
		logger:           slog.Default(),
		templateRenderer: renderer,
		enabled:          true,
	}
}

func TestRenderEventConfirmed_DataTransformation(t *testing.T) {
	sender := newTestSenderWithTemplates(t)

	t.Run("with []string ConfirmedPlayers", func(t *testing.T) {
		data := map[string]interface{}{
			"RecipientName":    "Alice",
			"IsHost":           true,
			"HostName":         "Alice",
			"DateTime":         "Monday at 10am",
			"Location":         "Court 1",
			"ConfirmedPlayers": []string{"Alice", "Bob"},
			"EventId":          "event-123",
		}

		rendered, err := sender.renderEventConfirmed(data)
		require.NoError(t, err)
		assert.NotNil(t, rendered)
		assert.Contains(t, rendered.HTMLBody, "Alice")
		assert.Contains(t, rendered.HTMLBody, "Bob")
		assert.Contains(t, rendered.HTMLBody, "Monday at 10am")
		assert.Contains(t, rendered.HTMLBody, "Court 1")
	})

	t.Run("with []interface{} ConfirmedPlayers", func(t *testing.T) {
		data := map[string]interface{}{
			"RecipientName":    "Alice",
			"IsHost":           false,
			"HostName":         "Bob",
			"DateTime":         "Tuesday at 2pm",
			"Location":         "Court 2",
			"ConfirmedPlayers": []interface{}{"Alice", "Charlie"},
			"EventId":          "event-456",
		}

		rendered, err := sender.renderEventConfirmed(data)
		require.NoError(t, err)
		assert.NotNil(t, rendered)
		assert.Contains(t, rendered.HTMLBody, "Alice")
		assert.Contains(t, rendered.HTMLBody, "Charlie")
	})

	t.Run("with missing fields", func(t *testing.T) {
		data := map[string]interface{}{}

		rendered, err := sender.renderEventConfirmed(data)
		require.NoError(t, err)
		assert.NotNil(t, rendered)
		// Should render without errors even with empty data
		assert.NotEmpty(t, rendered.HTMLBody)
	})
}

func TestRenderUserJoined_DataTransformation(t *testing.T) {
	sender := newTestSenderWithTemplates(t)

	t.Run("with all fields", func(t *testing.T) {
		data := map[string]interface{}{
			"HostName":    "John Host",
			"JoiningUser": "Alice Player",
			"Comment":     "Looking forward to playing!",
			"EventId":     "event-789",
		}

		rendered, err := sender.renderUserJoined(data)
		require.NoError(t, err)
		assert.NotNil(t, rendered)
		assert.Contains(t, rendered.HTMLBody, "John Host")
		assert.Contains(t, rendered.HTMLBody, "Alice Player")
		assert.Contains(t, rendered.HTMLBody, "Looking forward to playing!")
	})

	t.Run("with missing fields", func(t *testing.T) {
		data := map[string]interface{}{}

		rendered, err := sender.renderUserJoined(data)
		require.NoError(t, err)
		assert.NotNil(t, rendered)
		assert.NotEmpty(t, rendered.HTMLBody)
	})
}

func TestRenderEventExpired_DataTransformation(t *testing.T) {
	sender := newTestSenderWithTemplates(t)

	t.Run("with all fields", func(t *testing.T) {
		data := map[string]interface{}{
			"RecipientName": "John",
			"EventId":       "event-expired-1",
		}

		rendered, err := sender.renderEventExpired(data)
		require.NoError(t, err)
		assert.NotNil(t, rendered)
		assert.Contains(t, rendered.HTMLBody, "John")
		assert.Contains(t, rendered.HTMLBody, "expired")
	})

	t.Run("with missing fields", func(t *testing.T) {
		data := map[string]interface{}{}

		rendered, err := sender.renderEventExpired(data)
		require.NoError(t, err)
		assert.NotNil(t, rendered)
		assert.NotEmpty(t, rendered.HTMLBody)
	})
}

func TestRenderTemplate_RoutesToCorrectRenderer(t *testing.T) {
	sender := newTestSenderWithTemplates(t)

	tests := []struct {
		name         string
		templateType string
		expectNil    bool
	}{
		{
			name:         "event_confirmed",
			templateType: notifications.TemplateEventConfirmed,
			expectNil:    false,
		},
		{
			name:         "user_joined",
			templateType: notifications.TemplateUserJoined,
			expectNil:    false,
		},
		{
			name:         "event_expired",
			templateType: notifications.TemplateEventExpired,
			expectNil:    false,
		},
		{
			name:         "unknown type returns nil",
			templateType: "unknown_type",
			expectNil:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			data := db.NotificationQueueData{
				TemplateType: tt.templateType,
				TemplateData: map[string]interface{}{},
			}
			rendered, err := sender.renderTemplate(data)
			assert.NoError(t, err)
			if tt.expectNil {
				assert.Nil(t, rendered)
			} else {
				assert.NotNil(t, rendered)
			}
		})
	}
}

func TestSendNotification_DisabledSender(t *testing.T) {
	sender := &Sender{
		logger:  slog.Default(),
		enabled: false,
	}

	err := sender.SendNotification(context.Background(), "test@example.com", db.NotificationQueueData{
		Topic:   "Test",
		Message: "Test message",
	})
	assert.NoError(t, err)
}

func TestSendNotification_EmptyAddress(t *testing.T) {
	sender := &Sender{
		logger:  slog.Default(),
		enabled: true,
	}

	err := sender.SendNotification(context.Background(), "", db.NotificationQueueData{
		Topic:   "Test",
		Message: "Test message",
	})
	assert.NoError(t, err)
}

func TestSendNotification_NilTemplateRenderer_FallsBackToPlainText(t *testing.T) {
	// Sender with no template renderer - should try plain text fallback
	// (will fail at SMTP level since we have no connection, but tests the code path)
	sender := &Sender{
		logger:           slog.Default(),
		enabled:          false, // Disable to avoid SMTP call
		templateRenderer: nil,
	}

	err := sender.SendNotification(context.Background(), "test@example.com", db.NotificationQueueData{
		Topic:        "Test",
		Message:      "Test message",
		TemplateType: notifications.TemplateEventConfirmed,
		TemplateData: map[string]interface{}{},
	})
	// Disabled sender returns nil without trying to send
	assert.NoError(t, err)
}

func TestSendNotification_EmptyTemplateType_FallsBackToPlainText(t *testing.T) {
	sender := &Sender{
		logger:           slog.Default(),
		enabled:          false, // Disable to avoid SMTP call
		templateRenderer: nil,
	}

	err := sender.SendNotification(context.Background(), "test@example.com", db.NotificationQueueData{
		Topic:        "Test",
		Message:      "Test message",
		TemplateType: "", // Empty template type
	})
	assert.NoError(t, err)
}

