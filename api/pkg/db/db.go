package db

import (
	"context"
	"database/sql"
	"log/slog"
	"maps"
	"slices"
	"strings"
	"sync"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/api"
)

var (
	dbConn *sqlx.DB
	once   sync.Once
)

type Db struct {
	conn *sqlx.DB
}

// GetDB returns a singleton database connection
func GetDB(config *pkg.DbConfig) (*Db, error) {
	var err error
	var db *Db

	once.Do(func() {
		slog.Info("Initializing database connection", "host", config.Host, "port", config.Port, "database", config.Database)

		// Create the base DB connection
		sqlDB, err := sql.Open("mysql", config.GetConnectionString())
		if err != nil {
			slog.Error("Failed to connect to database", "error", err)
			return
		}

		// Convert to sqlx.DB
		dbConn = sqlx.NewDb(sqlDB, "mysql")

		err = dbConn.Ping()
		if err != nil {
			slog.Error("Failed to ping database", "error", err)
			return
		}

		// Configure connection pool
		dbConn.SetMaxOpenConns(25)
		dbConn.SetMaxIdleConns(5)

		slog.Info("Database connection established")
		db = &Db{conn: dbConn}
	})

	if err != nil {
		return nil, err
	}

	return db, nil
}

func (db *Db) Ping(ctx context.Context) error {
	err := db.conn.PingContext(ctx)
	if err != nil {
		slog.Error("Failed to ping database", "error", err)
	}
	return err
}

// GetAllFacilities retrieves all facilities from the database
func (db *Db) GetAllFacilities(ctx context.Context) ([]api.Location, error) {
	query := `SELECT
		id,
		name,
		address,
		ST_Y(location) as 'coordinates.latitude',
		ST_X(location) as 'coordinates.longitude'
	FROM xtp_tour.facilities`

	slog.Debug("Executing SQL query", "query", query)
	var locations []api.Location
	err := db.conn.SelectContext(ctx, &locations, query)
	if err != nil {
		slog.Error("Failed to get facilities from database", "error", err, "query", query)
		return nil, err
	}

	return locations, nil
}

func (db *Db) CreateEvent(ctx context.Context, event *api.EventData) error {
	tx, err := db.conn.BeginTxx(ctx, nil)
	if err != nil {
		slog.Error("Failed to begin transaction", "error", err)
		return err
	}
	event.Id = uuid.New().String()

	ctxLog := slog.With("userId", event.UserId, "eventId", event.Id)

	// Find the earliest time slot
	var earliestTime time.Time
	for i, timeSlot := range event.TimeSlots {
		dt := api.ParseDt(timeSlot)
		if i == 0 || dt.Before(earliestTime) {
			earliestTime = dt
		}
	}

	// Set expiration time to 4 hours before the earliest time slot
	expirationTime := earliestTime.Add(-4 * time.Hour)
	event.ExpirationTime = api.DtToIso(expirationTime)

	// Create EventRow from api.EventData
	eventRow := EventRow{
		Id:              event.Id,
		UserId:          event.UserId,
		SkillLevel:      string(event.SkillLevel),
		Description:     event.Description,
		EventType:       string(event.EventType),
		ExpectedPlayers: event.ExpectedPlayers,
		SessionDuration: event.SessionDuration,
		Visibility:      string(event.Visibility),
		ExpirationTime:  api.ParseDt(event.ExpirationTime),
		Status:          string(api.EventStatusOpen),
		CreatedAt:       time.Now(),
	}

	query := `INSERT INTO events (id, user_id, skill_level, description, event_type, expected_players, session_duration, visibility, expiration_time, status, created_at) 
		VALUES (:id, :user_id, :skill_level, :description, :event_type, :expected_players, :session_duration, :visibility, :expiration_time, :status, :created_at)`
	slog.Debug("Executing SQL query", "query", query, "params", eventRow)
	_, err = tx.NamedExecContext(ctx, query, eventRow)
	if err != nil {
		tx.Rollback()
		ctxLog.Error("Failed to insert event", "error", err)
		return err
	}

	query = `INSERT INTO event_locations (event_id, location_id) VALUES (:event_id, :location_id)`
	locations := make([]EventLocationRow, len(event.Locations))

	for i, location := range event.Locations {
		locations[i] = EventLocationRow{
			EventId:    event.Id,
			LocationId: location,
		}
	}
	slog.Debug("Executing SQL query", "query", query, "params", locations)
	_, err = tx.NamedExecContext(ctx, query, locations)
	if err != nil {
		tx.Rollback()
		ctxLog.Error("Failed to insert event locations", "error", err)
		return err
	}

	query = `INSERT INTO event_time_slots (event_id, dt) VALUES (:event_id, :dt)`

	timeSlots := make([]EventTimeSlotRow, len(event.TimeSlots))
	for i, timeSlot := range event.TimeSlots {
		timeSlots[i] = EventTimeSlotRow{
			EventId: event.Id,
			Dt:      api.ParseDt(timeSlot),
		}
	}
	slog.Debug("Executing SQL query", "query", query, "params", timeSlots)
	_, err = tx.NamedExecContext(ctx, query, timeSlots)
	if err != nil {
		tx.Rollback()
		ctxLog.Error("Failed to insert event time slot", "error", err)
		return err
	}

	err = tx.Commit()
	if err != nil {
		ctxLog.Error("Failed to commit transaction", "error", err)
		return err
	}
	return nil
}

func (db *Db) GetEventsOfUser(ctx context.Context, userId string) ([]*api.Event, error) {
	// First, get all events for the user
	return db.getEventsInternal(ctx, "user_id = ?", userId)
}

func (db *Db) GetPublicEvents(ctx context.Context, userId string) ([]*api.Event, error) {
	return db.getEventsInternal(ctx, "user_id <> ? AND visibility = ? AND status = ? AND expiration_time > ?", userId, api.EventVisibilityPublic, api.EventStatusOpen, time.Now().UTC())
}

func (db *Db) GetJoinedEvents(ctx context.Context, userId string) ([]*api.Event, error) {
	query := `SELECT event_id FROM join_requests j
		inner join events e on j.event_id = e.id
	WHERE j.user_id = ?`
	slog.Debug("Executing SQL query", "query", query, "params", userId)
	rows, err := db.conn.QueryContext(ctx, query, userId)
	if err != nil {
		slog.Error("Failed to get accepted events", "error", err)
		return nil, err
	}

	defer rows.Close()
	var eventIds []string
	for rows.Next() {
		var eventId string
		if err := rows.Scan(&eventId); err != nil {
			slog.Error("Failed to scan event ID", "error", err)
			return nil, err
		}
		eventIds = append(eventIds, eventId)
	}
	if len(eventIds) == 0 {
		return nil, nil
	}

	slog.Info("Accepted events", "eventIds", eventIds)

	return db.getEventsInternal(ctx, "event_id IN (?) ", eventIds)
}

func (db *Db) getEventsInternal(ctx context.Context, filter string, filterVals ...interface{}) ([]*api.Event, error) {
	// First query: get all events, timeslots, locations and confirmations
	query := `
		WITH event_data AS (
			SELECT DISTINCT
				e.id as event_id,
				e.user_id,
				e.skill_level,
				e.description,
				e.event_type,
				e.expected_players,
				e.session_duration,
				e.visibility,
				e.status,
				e.created_at,
				e.expiration_time,
				GROUP_CONCAT(DISTINCT el.location_id) as locations,
				GROUP_CONCAT(DISTINCT ets.dt) as time_slots,
				c.location_id as confirmed_location,
				c.dt as confirmed_dt,
				c.duration as confirmed_duration
			FROM events e
			LEFT JOIN event_locations el ON e.id = el.event_id
			LEFT JOIN event_time_slots ets ON e.id = ets.event_id
			LEFT JOIN confirmations c ON e.id = c.event_id
			GROUP BY e.id, e.user_id, e.skill_level, e.description, e.event_type,
				e.expected_players, e.session_duration, e.visibility, e.status, e.created_at,
				e.expiration_time, c.location_id, c.dt, c.duration
		)
		SELECT * FROM event_data 
	`

	if filter != "" {
		query += " WHERE " + filter
	}

	query += " ORDER BY created_at desc"

	var err error
	var rows *sql.Rows
	if strings.Contains(strings.ToLower(filter), "in") {
		var args []interface{}
		query, args, err = sqlx.In(query, filterVals...)
		if err != nil {
			slog.Error("Failed to prepare query with IN clause", "error", err)
			return nil, err
		}

		query = db.conn.Rebind(query)
		slog.Debug("Executing SQL query with IN clause", "query", query, "params", args)
		rows, err = db.conn.QueryContext(ctx, query, args...)
	} else {
		slog.Debug("Executing SQL query", "query", query, "params", filterVals)
		rows, err = db.conn.QueryContext(ctx, query, filterVals...)
	}

	if err != nil {
		slog.Error("Failed to get  events", "error", err)
		return nil, err
	}
	defer rows.Close()

	eventMap := make(map[string]*api.Event)

	for rows.Next() {
		var (
			eventId         string
			userId          string
			skillLevel      string
			description     string
			eventType       string
			expectedPlayers int
			sessionDuration int
			visibility      string
			status          string
			createdAt       time.Time
			expirationTime  time.Time
			locationsStr    sql.NullString
			timeSlotsStr    sql.NullString
			confirmedLoc    sql.NullString
			confirmedDt     sql.NullTime
			confirmedDur    sql.NullInt64
		)

		err := rows.Scan(
			&eventId, &userId, &skillLevel, &description, &eventType,
			&expectedPlayers, &sessionDuration, &visibility, &status,
			&createdAt, &expirationTime, &locationsStr, &timeSlotsStr,
			&confirmedLoc, &confirmedDt, &confirmedDur,
		)
		if err != nil {
			slog.Error("Failed to scan event row", "error", err)
			return nil, err
		}

		// Parse locations
		var locations []string
		if locationsStr.Valid {
			locations = strings.Split(locationsStr.String, ",")
		}

		// Parse time slots
		var timeSlots []time.Time
		if timeSlotsStr.Valid {
			slots := strings.Split(timeSlotsStr.String, ",")
			for _, slot := range slots {
				dt, err := time.Parse("2006-01-02 15:04:05", slot)
				if err == nil {
					timeSlots = append(timeSlots, dt)
				}
			}
		}

		// Parse confirmation
		var confirmation *api.Confirmation
		if confirmedLoc.Valid && confirmedDt.Valid && confirmedDur.Valid {
			confirmation = &api.Confirmation{
				EventId:    eventId,
				LocationId: confirmedLoc.String,
				Datetime:   api.DtToIso(confirmedDt.Time),
				Duration:   int(confirmedDur.Int64),
				CreatedAt:  api.DtToIso(time.Now()),
			}
		}

		event := &api.Event{
			EventData: api.EventData{
				Id:              eventId,
				UserId:          userId,
				Locations:       locations,
				SkillLevel:      api.SkillLevel(skillLevel),
				Description:     description,
				EventType:       api.EventType(eventType),
				ExpectedPlayers: expectedPlayers,
				SessionDuration: sessionDuration,
				TimeSlots:       api.DtToIsoArray(timeSlots),
				Visibility:      api.EventVisibility(visibility),
				ExpirationTime:  api.DtToIso(expirationTime),
			},
			Status:       api.EventStatus(status),
			CreatedAt:    api.DtToIso(createdAt),
			Confirmation: confirmation,
		}

		eventMap[eventId] = event
	}

	if len(eventMap) == 0 {
		return nil, nil
	}

	// Second query: get all join requests for these events
	joinRequestsQuery := `
			SELECT
				jr.id,
				jr.event_id,
				jr.user_id as join_owner_id,
				jr.comment,
				jr.created_at,
				jr.is_rejected,
				c.id as confirmation_id
		FROM join_requests jr
		LEFT JOIN confirmation_join_requests cjr ON jr.id = cjr.join_request_id
		LEFT JOIN confirmations c ON cjr.confirmation_id = c.id
		WHERE jr.event_id IN (?)
		ORDER BY jr.created_at
	`
	query, args, err := sqlx.In(joinRequestsQuery, slices.Collect(maps.Keys(eventMap)))
	if err != nil {
		slog.Error("Failed to prepare join requests query", "error", err)
		return nil, err
	}
	query = db.conn.Rebind(query)

	slog.Debug("Executing SQL query for join requests", "query", query, "params", args)
	joinRequestRows, err := db.conn.QueryContext(ctx, query, args...)
	if err != nil {
		slog.Error("Failed to get join requests", "error", err)
		return nil, err
	}
	defer joinRequestRows.Close()

	for joinRequestRows.Next() {
		var (
			id             string
			eventId        string
			joinOwnerId    string
			comment        string
			createdAt      time.Time
			isRejected     bool
			confirmationId sql.NullString
		)

		err := joinRequestRows.Scan(&id, &eventId, &joinOwnerId, &comment, &createdAt, &isRejected, &confirmationId)
		if err != nil {
			slog.Error("Failed to scan join request row", "error", err)
			continue
		}

		if event, exists := eventMap[eventId]; exists {
			joinRequest := &api.JoinRequest{
				JoinRequestData: api.JoinRequestData{
					Id:      id,
					Comment: comment,
				},
				UserId:    joinOwnerId,
				CreatedAt: api.DtToIso(createdAt),
			}

			joinRequest.Status = getJoinRequestStatus(event.Status, confirmationId, isRejected)
			event.JoinRequests = append(event.JoinRequests, joinRequest)
		}
	}

	events := make([]*api.Event, 0, len(eventMap))

	for _, event := range eventMap {
		i, _ := slices.BinarySearchFunc(events, event, func(a, b *api.Event) int {
			dtA, _ := time.Parse(time.RFC1123, a.CreatedAt)
			dtB, _ := time.Parse(time.RFC1123, b.CreatedAt)
			return -1 * dtA.Compare(dtB)
		})
		events = slices.Insert(events, i, event)
	}

	return events, nil
}

func getJoinRequestStatus(eventStatus api.EventStatus, confirmationId sql.NullString, isRejected bool) api.JoinRequestStatus {
	if confirmationId.Valid {
		return api.JoinRequestStatusAccepted
	}

	if isRejected {
		return api.JoinRequestStatusRejected
	}

	switch eventStatus {
	case api.EventStatusConfirmed:
		return api.JoinRequestStatusRejected
	case api.EventStatusCancelled:
		return api.JoinRequestStatusCancelled
	case api.EventStatusReservationFailed:
		return api.JoinRequestStatusReservationFailed
	default:
		return api.JoinRequestStatusWaiting
	}
}

func (db *Db) GetEventLocations(ctx context.Context, eventId string) ([]string, error) {
	query := `SELECT location_id FROM event_locations WHERE event_id = ?`
	slog.Debug("Executing SQL query", "query", query, "params", eventId)
	var locations []string
	err := db.conn.SelectContext(ctx, &locations, query, eventId)
	if err != nil {
		slog.Error("Failed to get event locations", "error", err, "eventId", eventId)
		return nil, err
	}
	return locations, nil
}

func (db *Db) GetEventTimeSlots(ctx context.Context, eventId string) ([]time.Time, error) {
	query := `SELECT dt FROM event_time_slots WHERE event_id = ?`
	slog.Debug("Executing SQL query", "query", query, "params", eventId)
	var timeSlots []time.Time
	err := db.conn.SelectContext(ctx, &timeSlots, query, eventId)
	if err != nil {
		slog.Error("Failed to get event time slots", "error", err, "eventId", eventId)
		return nil, err
	}
	return timeSlots, nil
}

func (db *Db) GetMyEvent(ctx context.Context, userId string, eventId string) (*api.Event, error) {
	events, err := db.getEventsInternal(ctx, "event_id = ? and user_id = ?", eventId, userId)
	if err != nil {
		return nil, err
	}
	if len(events) == 0 {
		return nil, nil
	}
	return events[0], nil
}

func (db *Db) GetPublicEvent(ctx context.Context, eventId string) (*api.Event, error) {
	events, err := db.getEventsInternal(ctx, "event_id = ? and visibility = ?", eventId, api.EventVisibilityPublic)
	if err != nil {
		return nil, err
	}
	if len(events) == 0 {
		return nil, nil
	}
	return events[0], nil
}

func (db *Db) DeleteEvent(ctx context.Context, userId string, eventId string) error {
	query := `DELETE FROM events WHERE id = ? AND user_id = ?`
	slog.Debug("Executing SQL query", "query", query, "params", []interface{}{eventId, userId})
	result, err := db.conn.ExecContext(ctx, query, eventId, userId)
	if err != nil {
		slog.Error("Failed to delete event", "error", err, "eventId", eventId, "userId", userId)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		slog.Error("Failed to get rows affected", "error", err)
		return err
	}

	if rowsAffected == 0 {
		return DbObjectNotFoundError{Message: "Event not found"}
	}

	return nil
}

func (db *Db) CreateJoinRequest(ctx context.Context, eventId string, userId string, req *api.JoinRequestData) (joinRequestId string, err error) {
	tx, err := db.conn.BeginTxx(ctx, nil)
	if err != nil {
		slog.Error("Failed to begin transaction", "error", err)
		return "", err
	}

	// Create join request
	joinRequestId = uuid.New().String()
	query := `INSERT INTO join_requests (id, event_id, user_id, comment) VALUES (?, ?, ?, ?)`
	slog.Debug("Executing SQL query", "query", query, "params", []interface{}{joinRequestId, eventId, userId, req.Comment})
	_, err = tx.ExecContext(ctx, query, joinRequestId, eventId, userId, req.Comment)
	if err != nil {
		tx.Rollback()
		slog.Error("Failed to insert join request", "error", err)
		return "", err
	}

	// Insert locations
	if len(req.Locations) > 0 {
		query = `INSERT INTO join_request_locations (join_request_id, location_id) VALUES (?, ?)`
		for _, locationId := range req.Locations {
			slog.Debug("Executing SQL query", "query", query, "params", []interface{}{joinRequestId, locationId})
			_, err = tx.ExecContext(ctx, query, joinRequestId, locationId)
			if err != nil {
				tx.Rollback()
				slog.Error("Failed to insert join request location", "error", err)
				return "", err
			}
		}
	}

	// Insert time slots
	if len(req.TimeSlots) > 0 {
		query = `INSERT INTO join_request_time_slots (id, join_request_id, dt) VALUES (?, ?, ?)`
		for _, timeSlot := range req.TimeSlots {
			slog.Debug("Executing SQL query", "query", query, "params", []interface{}{uuid.New().String(), joinRequestId, api.ParseDt(timeSlot)})
			_, err = tx.ExecContext(ctx, query, uuid.New().String(), joinRequestId, api.ParseDt(timeSlot))
			if err != nil {
				tx.Rollback()
				slog.Error("Failed to insert join request time slot", "error", err)
				return "", err
			}
		}
	}

	err = tx.Commit()
	if err != nil {
		slog.Error("Failed to commit transaction", "error", err)
		return "", err
	}

	return joinRequestId, nil
}

type ValidationError struct {
	Message string
}

func (e *ValidationError) Error() string {
	return e.Message
}

func (db *Db) ConfirmEvent(ctx context.Context, userId string, eventId string, req *api.EventConfirmationRequest) (*api.Confirmation, error) {
	tx, err := db.conn.BeginTxx(ctx, nil)
	if err != nil {
		slog.Error("Failed to begin transaction", "error", err)
		return nil, err
	}

	// Create confirmation
	confirmationId := uuid.New().String()
	query := `INSERT INTO confirmations (id, event_id, location_id, dt, duration) VALUES (?, ?, ?, ?, ?)`
	slog.Debug("Executing SQL query", "query", query, "params", []interface{}{confirmationId, eventId, req.LocationId, api.ParseDt(req.DateTime), req.Duration})
	_, err = tx.ExecContext(ctx, query, confirmationId, eventId, req.LocationId, api.ParseDt(req.DateTime), req.Duration)
	if err != nil {
		tx.Rollback()
		slog.Error("Failed to create confirmation", "error", err)
		return nil, err
	}

	// Link join requests to confirmation
	for _, joinRequestId := range req.JoinRequestsIds {
		query = `INSERT INTO confirmation_join_requests (confirmation_id, join_request_id) VALUES (?, ?)`
		slog.Debug("Executing SQL query", "query", query, "params", []interface{}{confirmationId, joinRequestId})
		_, err = tx.ExecContext(ctx, query, confirmationId, joinRequestId)
		if err != nil {
			tx.Rollback()
			slog.Error("Failed to link join request to confirmation", "error", err)
			return nil, err
		}
	}

	// Update event status
	query = `UPDATE events SET status = ? WHERE id = ?`
	slog.Debug("Executing SQL query", "query", query, "params", []interface{}{api.EventStatusConfirmed, eventId})
	_, err = tx.ExecContext(ctx, query, api.EventStatusConfirmed, eventId)
	if err != nil {
		tx.Rollback()
		slog.Error("Failed to update event status", "error", err)
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		slog.Error("Failed to commit transaction", "error", err)
		return nil, err
	}

	// Build response
	confirmation := &api.Confirmation{
		EventId:    eventId,
		LocationId: req.LocationId,
		Datetime:   req.DateTime,
		Duration:   req.Duration,
		CreatedAt:  api.DtToIso(time.Now()),
	}

	return confirmation, nil
}

// Add helper methods for router validation
func (db *Db) GetEventOwner(ctx context.Context, eventId string) (string, error) {
	query := `SELECT user_id FROM events WHERE id = ?`
	slog.Debug("Executing SQL query", "query", query, "params", eventId)
	var userId string
	err := db.conn.GetContext(ctx, &userId, query, eventId)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", DbObjectNotFoundError{Message: "Event not found"}
		}
		slog.Error("Failed to get event owner", "error", err, "eventId", eventId)
		return "", err
	}
	return userId, nil
}

func (db *Db) getJoinRequests(ctx context.Context, eventId string) ([]*api.JoinRequest, error) {
	query := `SELECT id, event_id, user_id, status, comment, created_at FROM join_requests WHERE event_id = ?`
	slog.Debug("Executing SQL query", "query", query, "params", eventId)
	var rows []*JoinRequestRow
	err := db.conn.SelectContext(ctx, &rows, query, eventId)
	if err != nil {
		slog.Error("Failed to get join requests", "error", err, "eventId", eventId)
		return nil, err
	}

	joinRequests := make([]*api.JoinRequest, len(rows))
	for i, row := range rows {
		joinRequests[i] = &api.JoinRequest{
			JoinRequestData: api.JoinRequestData{
				Id:      row.Id,
				Comment: row.Comment,
			},
			UserId: row.UserId,
			Status: api.JoinRequestStatus(row.Status),
		}
	}

	return joinRequests, nil
}

func (db *Db) getEventConfirmation(ctx context.Context, eventId string) (*ConfirmationRow, error) {
	query := `SELECT id, event_id, location_id, dt, duration FROM confirmations WHERE event_id = ?`
	slog.Debug("Executing SQL query", "query", query, "params", eventId)
	var rows []*ConfirmationRow
	err := db.conn.SelectContext(ctx, &rows, query, eventId)
	if err != nil {
		slog.Error("Failed to get event confirmation", "error", err, "eventId", eventId)
		return nil, err
	}

	if len(rows) == 0 {
		return nil, nil
	}

	return rows[0], nil
}

func (db *Db) DeleteJoinRequest(ctx context.Context, userId string, joinRequestId string) error {
	query := `DELETE FROM join_requests WHERE id = ? AND user_id = ?`
	slog.Debug("Executing SQL query", "query", query, "params", []interface{}{joinRequestId, userId})
	result, err := db.conn.ExecContext(ctx, query, joinRequestId, userId)
	if err != nil {
		slog.Error("Failed to delete join request", "error", err, "joinRequestId", joinRequestId, "userId", userId)
		return err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		slog.Error("Failed to get rows affected", "error", err)
		return err
	}

	if rowsAffected == 0 {
		return DbObjectNotFoundError{Message: "Join request not found"}
	}

	return nil
}

func (db *Db) GetJoinRequest(ctx context.Context, joinRequestId string) (*api.JoinRequest, error) {
	query := `
		SELECT 
			jr.id,
			jr.event_id,
			jr.user_id,
			jr.comment,
			jr.created_at,
			jr.is_rejected,
			GROUP_CONCAT(DISTINCT jrl.location_id) as locations,
			GROUP_CONCAT(DISTINCT jrts.dt) as time_slots
		FROM join_requests jr
		LEFT JOIN join_request_locations jrl ON jr.id = jrl.join_request_id
		LEFT JOIN join_request_time_slots jrts ON jr.id = jrts.join_request_id
		WHERE jr.id = ?
		GROUP BY jr.id, jr.event_id, jr.user_id, jr.comment, jr.created_at, jr.is_rejected`

	slog.Debug("Executing SQL query", "query", query, "params", joinRequestId)

	var result struct {
		ID         string         `db:"id"`
		EventID    string         `db:"event_id"`
		UserID     string         `db:"user_id"`
		Comment    string         `db:"comment"`
		CreatedAt  time.Time      `db:"created_at"`
		IsRejected bool           `db:"is_rejected"`
		Locations  sql.NullString `db:"locations"`
		TimeSlots  sql.NullString `db:"time_slots"`
	}

	err := db.conn.GetContext(ctx, &result, query, joinRequestId)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, DbObjectNotFoundError{Message: "Join request not found"}
		}
		slog.Error("Failed to get join request", "error", err, "joinRequestId", joinRequestId)
		return nil, err
	}

	joinRequest := &api.JoinRequest{
		JoinRequestData: api.JoinRequestData{
			Id:      result.ID,
			Comment: result.Comment,
		},
		UserId:     result.UserID,
		CreatedAt:  api.DtToIso(result.CreatedAt),
		IsRejected: result.IsRejected,
	}

	// Parse locations
	if result.Locations.Valid {
		joinRequest.Locations = strings.Split(result.Locations.String, ",")
	}

	// Parse time slots
	if result.TimeSlots.Valid {
		slots := strings.Split(result.TimeSlots.String, ",")
		timeSlots := make([]time.Time, 0, len(slots))
		for _, slot := range slots {
			dt, err := time.Parse("2006-01-02 15:04:05", slot)
			if err == nil {
				timeSlots = append(timeSlots, dt)
			}
		}
		joinRequest.TimeSlots = api.DtToIsoArray(timeSlots)
	}

	return joinRequest, nil
}
