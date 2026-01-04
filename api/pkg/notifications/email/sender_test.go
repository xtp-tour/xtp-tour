package email

import (
	"context"
	"log/slog"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/xtp-tour/xtp-tour/api/pkg"
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

