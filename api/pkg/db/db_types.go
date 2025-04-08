package db

import (
	"time"
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
	EventId string `db:"event_id"`
	Date    string `db:"date"`
	Time    int    `db:"time"`
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
