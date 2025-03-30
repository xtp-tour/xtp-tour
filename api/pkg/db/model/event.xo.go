package model

// Code generated by xo. DO NOT EDIT.

import (
	"context"
	"database/sql"
	"time"
)

// Event represents a row from 'xtp_tour.events'.
type Event struct {
	ID              string         `json:"id"`               // id
	UserID          string         `json:"user_id"`          // user_id
	SkillLevel      SkillLevel     `json:"skill_level"`      // skill_level
	Description     sql.NullString `json:"description"`      // description
	EventType       EventType      `json:"event_type"`       // event_type
	ExpectedPlayers int            `json:"expected_players"` // expected_players
	SessionDuration int            `json:"session_duration"` // session_duration
	Status          Status         `json:"status"`           // status
	CreatedAt       time.Time      `json:"created_at"`       // created_at
	UpdatedAt       time.Time      `json:"updated_at"`       // updated_at
	// xo fields
	_exists, _deleted bool
}

// Exists returns true when the [Event] exists in the database.
func (e *Event) Exists() bool {
	return e._exists
}

// Deleted returns true when the [Event] has been marked for deletion
// from the database.
func (e *Event) Deleted() bool {
	return e._deleted
}

// Insert inserts the [Event] to the database.
func (e *Event) Insert(ctx context.Context, db DB) error {
	switch {
	case e._exists: // already exists
		return logerror(&ErrInsertFailed{ErrAlreadyExists})
	case e._deleted: // deleted
		return logerror(&ErrInsertFailed{ErrMarkedForDeletion})
	}
	// insert (manual)
	const sqlstr = `INSERT INTO xtp_tour.events (` +
		`id, user_id, skill_level, description, event_type, expected_players, session_duration, status, created_at, updated_at` +
		`) VALUES (` +
		`?, ?, ?, ?, ?, ?, ?, ?, ?, ?` +
		`)`
	// run
	logf(sqlstr, e.ID, e.UserID, e.SkillLevel, e.Description, e.EventType, e.ExpectedPlayers, e.SessionDuration, e.Status, e.CreatedAt, e.UpdatedAt)
	if _, err := db.ExecContext(ctx, sqlstr, e.ID, e.UserID, e.SkillLevel, e.Description, e.EventType, e.ExpectedPlayers, e.SessionDuration, e.Status, e.CreatedAt, e.UpdatedAt); err != nil {
		return logerror(err)
	}
	// set exists
	e._exists = true
	return nil
}

// Update updates a [Event] in the database.
func (e *Event) Update(ctx context.Context, db DB) error {
	switch {
	case !e._exists: // doesn't exist
		return logerror(&ErrUpdateFailed{ErrDoesNotExist})
	case e._deleted: // deleted
		return logerror(&ErrUpdateFailed{ErrMarkedForDeletion})
	}
	// update with primary key
	const sqlstr = `UPDATE xtp_tour.events SET ` +
		`user_id = ?, skill_level = ?, description = ?, event_type = ?, expected_players = ?, session_duration = ?, status = ?, created_at = ?, updated_at = ? ` +
		`WHERE id = ?`
	// run
	logf(sqlstr, e.UserID, e.SkillLevel, e.Description, e.EventType, e.ExpectedPlayers, e.SessionDuration, e.Status, e.CreatedAt, e.UpdatedAt, e.ID)
	if _, err := db.ExecContext(ctx, sqlstr, e.UserID, e.SkillLevel, e.Description, e.EventType, e.ExpectedPlayers, e.SessionDuration, e.Status, e.CreatedAt, e.UpdatedAt, e.ID); err != nil {
		return logerror(err)
	}
	return nil
}

// Save saves the [Event] to the database.
func (e *Event) Save(ctx context.Context, db DB) error {
	if e.Exists() {
		return e.Update(ctx, db)
	}
	return e.Insert(ctx, db)
}

// Upsert performs an upsert for [Event].
func (e *Event) Upsert(ctx context.Context, db DB) error {
	switch {
	case e._deleted: // deleted
		return logerror(&ErrUpsertFailed{ErrMarkedForDeletion})
	}
	// upsert
	const sqlstr = `INSERT INTO xtp_tour.events (` +
		`id, user_id, skill_level, description, event_type, expected_players, session_duration, status, created_at, updated_at` +
		`) VALUES (` +
		`?, ?, ?, ?, ?, ?, ?, ?, ?, ?` +
		`)` +
		` ON DUPLICATE KEY UPDATE ` +
		`id = VALUES(id), user_id = VALUES(user_id), skill_level = VALUES(skill_level), description = VALUES(description), event_type = VALUES(event_type), expected_players = VALUES(expected_players), session_duration = VALUES(session_duration), status = VALUES(status), created_at = VALUES(created_at), updated_at = VALUES(updated_at)`
	// run
	logf(sqlstr, e.ID, e.UserID, e.SkillLevel, e.Description, e.EventType, e.ExpectedPlayers, e.SessionDuration, e.Status, e.CreatedAt, e.UpdatedAt)
	if _, err := db.ExecContext(ctx, sqlstr, e.ID, e.UserID, e.SkillLevel, e.Description, e.EventType, e.ExpectedPlayers, e.SessionDuration, e.Status, e.CreatedAt, e.UpdatedAt); err != nil {
		return logerror(err)
	}
	// set exists
	e._exists = true
	return nil
}

// Delete deletes the [Event] from the database.
func (e *Event) Delete(ctx context.Context, db DB) error {
	switch {
	case !e._exists: // doesn't exist
		return nil
	case e._deleted: // deleted
		return nil
	}
	// delete with single primary key
	const sqlstr = `DELETE FROM xtp_tour.events ` +
		`WHERE id = ?`
	// run
	logf(sqlstr, e.ID)
	if _, err := db.ExecContext(ctx, sqlstr, e.ID); err != nil {
		return logerror(err)
	}
	// set deleted
	e._deleted = true
	return nil
}

// EventByID retrieves a row from 'xtp_tour.events' as a [Event].
//
// Generated from index 'events_id_pkey'.
func EventByID(ctx context.Context, db DB, id string) (*Event, error) {
	// query
	const sqlstr = `SELECT ` +
		`id, user_id, skill_level, description, event_type, expected_players, session_duration, status, created_at, updated_at ` +
		`FROM xtp_tour.events ` +
		`WHERE id = ?`
	// run
	logf(sqlstr, id)
	e := Event{
		_exists: true,
	}
	if err := db.QueryRowContext(ctx, sqlstr, id).Scan(&e.ID, &e.UserID, &e.SkillLevel, &e.Description, &e.EventType, &e.ExpectedPlayers, &e.SessionDuration, &e.Status, &e.CreatedAt, &e.UpdatedAt); err != nil {
		return nil, logerror(err)
	}
	return &e, nil
}
