package model

// Code generated by xo. DO NOT EDIT.

import (
	"context"
)

// EventLocation represents a row from 'xtp_tour.event_locations'.
type EventLocation struct {
	EventID    string `json:"event_id"`    // event_id
	LocationID string `json:"location_id"` // location_id
	// xo fields
	_exists, _deleted bool
}

// Exists returns true when the [EventLocation] exists in the database.
func (el *EventLocation) Exists() bool {
	return el._exists
}

// Deleted returns true when the [EventLocation] has been marked for deletion
// from the database.
func (el *EventLocation) Deleted() bool {
	return el._deleted
}

// Insert inserts the [EventLocation] to the database.
func (el *EventLocation) Insert(ctx context.Context, db DB) error {
	switch {
	case el._exists: // already exists
		return logerror(&ErrInsertFailed{ErrAlreadyExists})
	case el._deleted: // deleted
		return logerror(&ErrInsertFailed{ErrMarkedForDeletion})
	}
	// insert (manual)
	const sqlstr = `INSERT INTO xtp_tour.event_locations (` +
		`event_id, location_id` +
		`) VALUES (` +
		`?, ?` +
		`)`
	// run
	logf(sqlstr, el.EventID, el.LocationID)
	if _, err := db.ExecContext(ctx, sqlstr, el.EventID, el.LocationID); err != nil {
		return logerror(err)
	}
	// set exists
	el._exists = true
	return nil
}

// ------ NOTE: Update statements omitted due to lack of fields other than primary key ------

// Delete deletes the [EventLocation] from the database.
func (el *EventLocation) Delete(ctx context.Context, db DB) error {
	switch {
	case !el._exists: // doesn't exist
		return nil
	case el._deleted: // deleted
		return nil
	}
	// delete with composite primary key
	const sqlstr = `DELETE FROM xtp_tour.event_locations ` +
		`WHERE event_id = ? AND location_id = ?`
	// run
	logf(sqlstr, el.EventID, el.LocationID)
	if _, err := db.ExecContext(ctx, sqlstr, el.EventID, el.LocationID); err != nil {
		return logerror(err)
	}
	// set deleted
	el._deleted = true
	return nil
}

// EventLocationByEventIDLocationID retrieves a row from 'xtp_tour.event_locations' as a [EventLocation].
//
// Generated from index 'event_locations_event_id_location_id_pkey'.
func EventLocationByEventIDLocationID(ctx context.Context, db DB, eventID, locationID string) (*EventLocation, error) {
	// query
	const sqlstr = `SELECT ` +
		`event_id, location_id ` +
		`FROM xtp_tour.event_locations ` +
		`WHERE event_id = ? AND location_id = ?`
	// run
	logf(sqlstr, eventID, locationID)
	el := EventLocation{
		_exists: true,
	}
	if err := db.QueryRowContext(ctx, sqlstr, eventID, locationID).Scan(&el.EventID, &el.LocationID); err != nil {
		return nil, logerror(err)
	}
	return &el, nil
}

// EventLocationsByLocationID retrieves a row from 'xtp_tour.event_locations' as a [EventLocation].
//
// Generated from index 'location_id'.
func EventLocationsByLocationID(ctx context.Context, db DB, locationID string) ([]*EventLocation, error) {
	// query
	const sqlstr = `SELECT ` +
		`event_id, location_id ` +
		`FROM xtp_tour.event_locations ` +
		`WHERE location_id = ?`
	// run
	logf(sqlstr, locationID)
	rows, err := db.QueryContext(ctx, sqlstr, locationID)
	if err != nil {
		return nil, logerror(err)
	}
	defer rows.Close()
	// process
	var res []*EventLocation
	for rows.Next() {
		el := EventLocation{
			_exists: true,
		}
		// scan
		if err := rows.Scan(&el.EventID, &el.LocationID); err != nil {
			return nil, logerror(err)
		}
		res = append(res, &el)
	}
	if err := rows.Err(); err != nil {
		return nil, logerror(err)
	}
	return res, nil
}

// Event returns the Event associated with the [EventLocation]'s (EventID).
//
// Generated from foreign key 'event_locations_ibfk_1'.
func (el *EventLocation) Event(ctx context.Context, db DB) (*Event, error) {
	return EventByID(ctx, db, el.EventID)
}

// Facility returns the Facility associated with the [EventLocation]'s (LocationID).
//
// Generated from foreign key 'event_locations_ibfk_2'.
func (el *EventLocation) Facility(ctx context.Context, db DB) (*Facility, error) {
	return FacilityByID(ctx, db, el.LocationID)
}
