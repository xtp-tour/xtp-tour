package db

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"

	"github.com/xtp-tour/xtp-tour/api/pkg/api"
)

type DbObjectNotFoundError struct {
	Message string
}

func (e DbObjectNotFoundError) Error() string {
	return e.Message
}

type EventLocationRow struct {
	EventId    string `db:"event_id"`
	LocationId string `db:"location_id"`
}

type EventTimeSlotRow struct {
	EventId string    `db:"event_id"`
	Dt      time.Time `db:"dt"`
}

type EventRow struct {
	Id              string    `db:"id"`
	UserId          string    `db:"user_id"`
	SkillLevel      string    `db:"skill_level"`
	Description     string    `db:"description"`
	EventType       string    `db:"event_type"`
	ExpectedPlayers int       `db:"expected_players"`
	SessionDuration int       `db:"session_duration"` // in minutes
	Visibility      string    `db:"visibility"`
	Status          string    `db:"status"`
	CreatedAt       time.Time `db:"created_at"`
	ExpirationTime  time.Time `db:"expiration_time"`
}

type JoinRequestRow struct {
	Id             string    `db:"id"`
	EventId        string    `db:"event_id"`
	UserId         string    `db:"user_id"`
	Status         string    `db:"status"`
	Comment        string    `db:"comment"`
	CreatedAt      time.Time `db:"created_at"`
	ConfirmationId string    `db:"confirmation_id"`
}

type ConfirmationRow struct {
	Id         string    `db:"id"`
	EventId    string    `db:"event_id"`
	LocationId string    `db:"location_id"`
	Dt         time.Time `db:"dt"`
	CreatedAt  time.Time `db:"created_at"`
}

func (row *ConfirmationRow) ToApi() *api.Confirmation {
	return &api.Confirmation{
		EventId:    row.EventId,
		LocationId: row.LocationId,
		Datetime:   api.DtToIso(row.Dt),
		CreatedAt:  api.DtToIso(row.CreatedAt),
	}
}

// Notification channel constants using bit flags
const (
	NotificationChannelEmail    = 1 << 0 // 00000001
	NotificationChannelSMS      = 1 << 1 // 00000010
	NotificationChannelDebug    = 1 << 2 // 00000100
	NotificationChannelPush     = 1 << 3 // 00001000 (future)
	NotificationChannelWhatsApp = 1 << 4 // 00010000 (future)
)

type NotificationSettings struct {
	Email        string `json:"email,omitempty"`
	PhoneNumber  string `json:"phone_number,omitempty"`
	DebugAddress string `json:"debug_address,omitempty"`
	Channels     uint8  `json:"channels" db:"channels"` // Bit flags for enabled channels
}

// IsChannelEnabled checks if a specific notification channel is enabled
func (n *NotificationSettings) IsChannelEnabled(channel uint8) bool {
	return (n.Channels & channel) != 0
}

// EnableChannel enables a specific notification channel
func (n *NotificationSettings) EnableChannel(channel uint8) {
	n.Channels |= channel
}

// DisableChannel disables a specific notification channel
func (n *NotificationSettings) DisableChannel(channel uint8) {
	n.Channels &^= channel
}

// GetEnabledChannels returns a slice of enabled channel names
func (n *NotificationSettings) GetEnabledChannels() []string {
	var enabled []string
	if n.IsChannelEnabled(NotificationChannelEmail) {
		enabled = append(enabled, "email")
	}
	if n.IsChannelEnabled(NotificationChannelSMS) {
		enabled = append(enabled, "sms")
	}
	if n.IsChannelEnabled(NotificationChannelDebug) {
		enabled = append(enabled, "debug")
	}
	if n.IsChannelEnabled(NotificationChannelPush) {
		enabled = append(enabled, "push")
	}
	if n.IsChannelEnabled(NotificationChannelWhatsApp) {
		enabled = append(enabled, "whatsapp")
	}
	return enabled
}

// Validate ensures at least one notification channel is enabled
func (n *NotificationSettings) Validate() error {
	if n.Channels == 0 {
		return errors.New("at least one notification channel must be enabled")
	}
	return nil
}

func (n *NotificationSettings) Value() (driver.Value, error) {
	if n == nil {
		return nil, nil
	}
	return json.Marshal(n)
}

func (n *NotificationSettings) Scan(value interface{}) error {
	if value == nil {
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return json.Unmarshal([]byte(value.(string)), n)
	}
	return json.Unmarshal(bytes, n)
}

type EventNotifSettingsResult struct {
	NotifSettings NotificationSettings
	UserId        string `db:"user_id"`
	IsAccepted    int    `db:"is_accepted"`
	IsHost        int    `db:"is_host"`
	Language      string `db:"language"`
}

type UserPreferences struct {
	Notifications NotificationSettings `json:"notifications,omitempty"`
	Language      string               `json:"language,omitempty"`
	Country       string               `json:"country,omitempty"`
	City          string               `json:"city,omitempty"`
}

func (u *UserPreferences) Value() (driver.Value, error) {
	if u == nil {
		return nil, nil
	}
	return json.Marshal(u)
}

func (u *UserPreferences) Scan(value interface{}) error {
	if value == nil {
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return json.Unmarshal([]byte(value.(string)), u)
	}
	return json.Unmarshal(bytes, u)
}

type NotificationQueueData struct {
	Topic   string `json:"topic"`
	Message string `json:"message"`
}

func (n *NotificationQueueData) Value() (driver.Value, error) {
	return json.Marshal(n)
}

func (n *NotificationQueueData) Scan(value interface{}) error {
	if value == nil {
		return nil
	}

	bytes, ok := value.([]byte)
	if !ok {
		return json.Unmarshal([]byte(value.(string)), n)
	}
	return json.Unmarshal(bytes, n)
}

type NotificationQueueRow struct {
	Id          string                `db:"id"`
	UserId      string                `db:"user_id"`
	Data        NotificationQueueData `db:"data"`
	Status      string                `db:"status"`
	CreatedAt   time.Time             `db:"created_at"`
	ProcessedAt *time.Time            `db:"processed_at"`
	RetryCount  int                   `db:"retry_count"`
	// User preferences from joined user_pref table
	UserPreferences UserPreferences `db:"user_preferences"`
}

const (
	NotificationStatusPending    = "pending"
	NotificationStatusProcessing = "processing"
	NotificationStatusCompleted  = "completed"
	NotificationStatusFailed     = "failed"
)

// Calendar integration types
type UserCalendarConnectionRow struct {
	Id           string    `db:"id"`
	UserId       string    `db:"user_id"`
	Provider     string    `db:"provider"`
	AccessToken  string    `db:"access_token"`
	RefreshToken string    `db:"refresh_token"`
	TokenExpiry  time.Time `db:"token_expiry"`
	CalendarId   string    `db:"calendar_id"`
	IsActive     bool      `db:"is_active"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

type UserCalendarPreferencesRow struct {
	UserId               string    `db:"user_id"`
	SyncEnabled          bool      `db:"sync_enabled"`
	SyncFrequencyMinutes int       `db:"sync_frequency_minutes"`
	ShowEventDetails     bool      `db:"show_event_details"`
	CreatedAt            time.Time `db:"created_at"`
	UpdatedAt            time.Time `db:"updated_at"`
}

type CalendarBusyTimeRow struct {
	Id         string    `db:"id"`
	UserId     string    `db:"user_id"`
	StartTime  time.Time `db:"start_time"`
	EndTime    time.Time `db:"end_time"`
	EventTitle string    `db:"event_title"`
	SyncedAt   time.Time `db:"synced_at"`
}
