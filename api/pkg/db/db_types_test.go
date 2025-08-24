package db

import (
	"testing"
)

func TestNotificationSettings_IsChannelEnabled(t *testing.T) {
	settings := &NotificationSettings{
		Channels: NotificationChannelEmail | NotificationChannelSMS,
	}

	if !settings.IsChannelEnabled(NotificationChannelEmail) {
		t.Error("Email channel should be enabled")
	}

	if !settings.IsChannelEnabled(NotificationChannelSMS) {
		t.Error("SMS channel should be enabled")
	}

	if settings.IsChannelEnabled(NotificationChannelDebug) {
		t.Error("Debug channel should not be enabled")
	}
}

func TestNotificationSettings_EnableChannel(t *testing.T) {
	settings := &NotificationSettings{
		Channels: NotificationChannelEmail,
	}

	settings.EnableChannel(NotificationChannelSMS)

	if !settings.IsChannelEnabled(NotificationChannelSMS) {
		t.Error("SMS channel should be enabled after enabling")
	}

	if !settings.IsChannelEnabled(NotificationChannelEmail) {
		t.Error("Email channel should still be enabled")
	}
}

func TestNotificationSettings_DisableChannel(t *testing.T) {
	settings := &NotificationSettings{
		Channels: NotificationChannelEmail | NotificationChannelSMS,
	}

	settings.DisableChannel(NotificationChannelEmail)

	if settings.IsChannelEnabled(NotificationChannelEmail) {
		t.Error("Email channel should not be enabled after disabling")
	}

	if !settings.IsChannelEnabled(NotificationChannelSMS) {
		t.Error("SMS channel should still be enabled")
	}
}

func TestNotificationSettings_GetEnabledChannels(t *testing.T) {
	settings := &NotificationSettings{
		Channels: NotificationChannelEmail | NotificationChannelDebug,
	}

	enabled := settings.GetEnabledChannels()

	expected := []string{"email", "debug"}
	if len(enabled) != len(expected) {
		t.Errorf("Expected %d enabled channels, got %d", len(expected), len(enabled))
	}

	for _, channel := range expected {
		found := false
		for _, enabledChannel := range enabled {
			if enabledChannel == channel {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("Expected channel %s to be enabled", channel)
		}
	}
}

func TestNotificationSettings_Validate(t *testing.T) {
	// Test with no channels enabled
	settings := &NotificationSettings{
		Channels: 0,
	}

	if err := settings.Validate(); err == nil {
		t.Error("Validation should fail when no channels are enabled")
	}

	// Test with channels enabled
	settings.Channels = NotificationChannelEmail
	if err := settings.Validate(); err != nil {
		t.Errorf("Validation should pass when channels are enabled: %v", err)
	}
}
