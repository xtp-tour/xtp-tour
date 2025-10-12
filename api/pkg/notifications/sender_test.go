package notifications

import (
	"context"
	"log/slog"
	"testing"

	"github.com/num30/config"
	"github.com/stretchr/testify/assert"
	"github.com/xtp-tour/xtp-tour/api/pkg"
)

func TestEmailSender_Disabled(t *testing.T) {
	config := pkg.EmailConfig{
		Enabled: false,
	}

	sender, err := NewRealEmailSender(config, slog.Default())
	assert.NoError(t, err)
	assert.NotNil(t, sender)
	assert.False(t, sender.enabled)

	// Should not send when disabled
	err = sender.Send(context.Background(), "test@example.com", "Test", "Test message")
	assert.NoError(t, err)
}

func TestEmailSender_ConfigValidation(t *testing.T) {
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
			_, err := NewRealEmailSender(tt.config, slog.Default())
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestEmailSender_EmptyAddress(t *testing.T) {
	config := pkg.EmailConfig{
		Enabled:  true,
		SmtpHost: "smtp.example.com",
		Port:     587,
		Username: "user",
		Password: "password",
		From:     "test@example.com",
	}

	sender, err := NewRealEmailSender(config, slog.Default())
	assert.NoError(t, err)

	// Should not send to empty address
	err = sender.Send(context.Background(), "", "Test", "Test message")
	assert.NoError(t, err)
}

func TestDEBUGEmailSender(t *testing.T) {
	conf := pkg.Config{}
	c := config.NewConfReader("service_test")
	c.Read(&conf)

	sender, err := NewRealEmailSender(conf.Notifications.Email, slog.Default())
	assert.NoError(t, err)

	err = sender.Send(context.Background(), "palnitsky@gmail.com", "Test", "Test message")
	assert.NoError(t, err)
}
