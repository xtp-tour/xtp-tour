package db

import (
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
	Email       string
	PhoneNumber string
}

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
