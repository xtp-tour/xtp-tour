package db

import (
	"database/sql/driver"
	"encoding/json"
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

type NotificationSettings struct {
	Email       string `json:"email,omitempty"`
	PhoneNumber string `json:"phone_number,omitempty"`
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
