// Package model contains generated code for schema 'xtp_tour'.
package model

// Code generated by xo. DO NOT EDIT.

import (
	"context"
	"time"
)

// Confirmation represents a row from 'xtp_tour.confirmations'.
type Confirmation struct {
	ID         string    `json:"id"`          // id
	EventID    string    `json:"event_id"`    // event_id
	LocationID string    `json:"location_id"` // location_id
	Date       time.Time `json:"date"`        // date
	Time       int       `json:"time"`        // time
	Duration   int       `json:"duration"`    // duration
	CreatedAt  time.Time `json:"created_at"`  // created_at
	// xo fields
	_exists, _deleted bool
}

// Exists returns true when the [Confirmation] exists in the database.
func (c *Confirmation) Exists() bool {
	return c._exists
}

// Deleted returns true when the [Confirmation] has been marked for deletion
// from the database.
func (c *Confirmation) Deleted() bool {
	return c._deleted
}

// Insert inserts the [Confirmation] to the database.
func (c *Confirmation) Insert(ctx context.Context, db DB) error {
	switch {
	case c._exists: // already exists
		return logerror(&ErrInsertFailed{ErrAlreadyExists})
	case c._deleted: // deleted
		return logerror(&ErrInsertFailed{ErrMarkedForDeletion})
	}
	// insert (manual)
	const sqlstr = `INSERT INTO xtp_tour.confirmations (` +
		`id, event_id, location_id, date, time, duration, created_at` +
		`) VALUES (` +
		`?, ?, ?, ?, ?, ?, ?` +
		`)`
	// run
	logf(sqlstr, c.ID, c.EventID, c.LocationID, c.Date, c.Time, c.Duration, c.CreatedAt)
	if _, err := db.ExecContext(ctx, sqlstr, c.ID, c.EventID, c.LocationID, c.Date, c.Time, c.Duration, c.CreatedAt); err != nil {
		return logerror(err)
	}
	// set exists
	c._exists = true
	return nil
}

// Update updates a [Confirmation] in the database.
func (c *Confirmation) Update(ctx context.Context, db DB) error {
	switch {
	case !c._exists: // doesn't exist
		return logerror(&ErrUpdateFailed{ErrDoesNotExist})
	case c._deleted: // deleted
		return logerror(&ErrUpdateFailed{ErrMarkedForDeletion})
	}
	// update with primary key
	const sqlstr = `UPDATE xtp_tour.confirmations SET ` +
		`event_id = ?, location_id = ?, date = ?, time = ?, duration = ?, created_at = ? ` +
		`WHERE id = ?`
	// run
	logf(sqlstr, c.EventID, c.LocationID, c.Date, c.Time, c.Duration, c.CreatedAt, c.ID)
	if _, err := db.ExecContext(ctx, sqlstr, c.EventID, c.LocationID, c.Date, c.Time, c.Duration, c.CreatedAt, c.ID); err != nil {
		return logerror(err)
	}
	return nil
}

// Save saves the [Confirmation] to the database.
func (c *Confirmation) Save(ctx context.Context, db DB) error {
	if c.Exists() {
		return c.Update(ctx, db)
	}
	return c.Insert(ctx, db)
}

// Upsert performs an upsert for [Confirmation].
func (c *Confirmation) Upsert(ctx context.Context, db DB) error {
	switch {
	case c._deleted: // deleted
		return logerror(&ErrUpsertFailed{ErrMarkedForDeletion})
	}
	// upsert
	const sqlstr = `INSERT INTO xtp_tour.confirmations (` +
		`id, event_id, location_id, date, time, duration, created_at` +
		`) VALUES (` +
		`?, ?, ?, ?, ?, ?, ?` +
		`)` +
		` ON DUPLICATE KEY UPDATE ` +
		`id = VALUES(id), event_id = VALUES(event_id), location_id = VALUES(location_id), date = VALUES(date), time = VALUES(time), duration = VALUES(duration), created_at = VALUES(created_at)`
	// run
	logf(sqlstr, c.ID, c.EventID, c.LocationID, c.Date, c.Time, c.Duration, c.CreatedAt)
	if _, err := db.ExecContext(ctx, sqlstr, c.ID, c.EventID, c.LocationID, c.Date, c.Time, c.Duration, c.CreatedAt); err != nil {
		return logerror(err)
	}
	// set exists
	c._exists = true
	return nil
}

// Delete deletes the [Confirmation] from the database.
func (c *Confirmation) Delete(ctx context.Context, db DB) error {
	switch {
	case !c._exists: // doesn't exist
		return nil
	case c._deleted: // deleted
		return nil
	}
	// delete with single primary key
	const sqlstr = `DELETE FROM xtp_tour.confirmations ` +
		`WHERE id = ?`
	// run
	logf(sqlstr, c.ID)
	if _, err := db.ExecContext(ctx, sqlstr, c.ID); err != nil {
		return logerror(err)
	}
	// set deleted
	c._deleted = true
	return nil
}

// ConfirmationByID retrieves a row from 'xtp_tour.confirmations' as a [Confirmation].
//
// Generated from index 'confirmations_id_pkey'.
func ConfirmationByID(ctx context.Context, db DB, id string) (*Confirmation, error) {
	// query
	const sqlstr = `SELECT ` +
		`id, event_id, location_id, date, time, duration, created_at ` +
		`FROM xtp_tour.confirmations ` +
		`WHERE id = ?`
	// run
	logf(sqlstr, id)
	c := Confirmation{
		_exists: true,
	}
	if err := db.QueryRowContext(ctx, sqlstr, id).Scan(&c.ID, &c.EventID, &c.LocationID, &c.Date, &c.Time, &c.Duration, &c.CreatedAt); err != nil {
		return nil, logerror(err)
	}
	return &c, nil
}

// ConfirmationsByEventID retrieves a row from 'xtp_tour.confirmations' as a [Confirmation].
//
// Generated from index 'event_id'.
func ConfirmationsByEventID(ctx context.Context, db DB, eventID string) ([]*Confirmation, error) {
	// query
	const sqlstr = `SELECT ` +
		`id, event_id, location_id, date, time, duration, created_at ` +
		`FROM xtp_tour.confirmations ` +
		`WHERE event_id = ?`
	// run
	logf(sqlstr, eventID)
	rows, err := db.QueryContext(ctx, sqlstr, eventID)
	if err != nil {
		return nil, logerror(err)
	}
	defer rows.Close()
	// process
	var res []*Confirmation
	for rows.Next() {
		c := Confirmation{
			_exists: true,
		}
		// scan
		if err := rows.Scan(&c.ID, &c.EventID, &c.LocationID, &c.Date, &c.Time, &c.Duration, &c.CreatedAt); err != nil {
			return nil, logerror(err)
		}
		res = append(res, &c)
	}
	if err := rows.Err(); err != nil {
		return nil, logerror(err)
	}
	return res, nil
}

// ConfirmationsByLocationID retrieves a row from 'xtp_tour.confirmations' as a [Confirmation].
//
// Generated from index 'location_id'.
func ConfirmationsByLocationID(ctx context.Context, db DB, locationID string) ([]*Confirmation, error) {
	// query
	const sqlstr = `SELECT ` +
		`id, event_id, location_id, date, time, duration, created_at ` +
		`FROM xtp_tour.confirmations ` +
		`WHERE location_id = ?`
	// run
	logf(sqlstr, locationID)
	rows, err := db.QueryContext(ctx, sqlstr, locationID)
	if err != nil {
		return nil, logerror(err)
	}
	defer rows.Close()
	// process
	var res []*Confirmation
	for rows.Next() {
		c := Confirmation{
			_exists: true,
		}
		// scan
		if err := rows.Scan(&c.ID, &c.EventID, &c.LocationID, &c.Date, &c.Time, &c.Duration, &c.CreatedAt); err != nil {
			return nil, logerror(err)
		}
		res = append(res, &c)
	}
	if err := rows.Err(); err != nil {
		return nil, logerror(err)
	}
	return res, nil
}

// Event returns the Event associated with the [Confirmation]'s (EventID).
//
// Generated from foreign key 'confirmations_ibfk_1'.
func (c *Confirmation) Event(ctx context.Context, db DB) (*Event, error) {
	return EventByID(ctx, db, c.EventID)
}

// Facility returns the Facility associated with the [Confirmation]'s (LocationID).
//
// Generated from foreign key 'confirmations_ibfk_2'.
func (c *Confirmation) Facility(ctx context.Context, db DB) (*Facility, error) {
	return FacilityByID(ctx, db, c.LocationID)
}
