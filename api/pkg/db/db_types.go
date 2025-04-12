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
	SessionDuration int       `db:"session_duration"`
	Visibility      string    `db:"visibility"`
	Status          string    `db:"status"`
	CreatedAt       time.Time `db:"created_at"`
}

type JoinRequestRow struct {
	Id        string    `db:"id"`
	EventId   string    `db:"event_id"`
	UserId    string    `db:"user_id"`
	Status    string    `db:"status"`
	Comment   string    `db:"comment"`
	CreatedAt time.Time `db:"created_at"`
}

type ConfirmationRow struct {
	Id         string    `db:"id"`
	EventId    string    `db:"event_id"`
	LocationId string    `db:"location_id"`
	Dt         time.Time `db:"dt"`
	Duration   int       `db:"duration"`
	CreatedAt  time.Time `db:"created_at"`
}

func (row *ConfirmationRow) ToApi() *api.Confirmation {
	return &api.Confirmation{
		EventId:    row.EventId,
		LocationId: row.LocationId,
		Datetime:   row.Dt,
		Duration:   row.Duration,
		CreatedAt:  row.CreatedAt,
	}
}
