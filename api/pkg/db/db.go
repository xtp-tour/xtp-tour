package db

import (
	"context"
	"log/slog"
	"sync"

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
		dbConn, err = sqlx.Connect("mysql", config.GetConnectionString())
		if err != nil {
			slog.Error("Failed to connect to database", "error", err)
			return
		}

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

	query := `INSERT INTO events (id, user_id, skill_level, description, event_type, expected_players, session_duration, visibility) VALUES (:id, :user_id, :skill_level, :description, :event_type, :expected_players, :session_duration, :visibility)`
	_, err = tx.NamedExecContext(ctx, query, event)
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
	_, err = tx.NamedExecContext(ctx, query, locations)
	if err != nil {
		tx.Rollback()
		ctxLog.Error("Failed to insert event locations", "error", err)
		return err
	}

	query = `INSERT INTO event_time_slots (event_id, date, time) VALUES (:event_id, :date, :time)`

	timeSlots := make([]EventTimeSlotRow, len(event.TimeSlots))
	for i, timeSlot := range event.TimeSlots {
		timeSlots[i] = EventTimeSlotRow{
			EventId: event.Id,
			Date:    timeSlot.Date,
			Time:    timeSlot.Time,
		}
	}
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

func (db *Db) GetEventsOfUser(ctx context.Context, userId string) ([]api.Event, error) {
	// First, get all events for the user
	return db.getEventsInternal(ctx, userId, "")
}

func (db *Db) getEventsInternal(ctx context.Context, userId string, extraFilter string, extraFilterParams ...interface{}) ([]api.Event, error) {
	query := `SELECT 
		e.id,
		e.user_id,
		e.skill_level,
		e.description,
		e.event_type,
		e.expected_players,
		e.session_duration,
		e.visibility,
		e.status,
		e.created_at
	FROM events e
	WHERE e.user_id = ?`
	if extraFilter != "" {
		query += " AND " + extraFilter
	}

	var eventRows []EventRow
	params := []interface{}{userId}
	params = append(params, extraFilterParams...)
	err := db.conn.SelectContext(ctx, &eventRows, query, params...)
	if err != nil {
		slog.Error("Failed to get user events", "error", err, "userId", userId)
		return nil, err
	}

	// Convert to API events
	events := make([]api.Event, len(eventRows))
	for i, row := range eventRows {
		// Get locations for this event
		locations, err := db.getEventLocations(ctx, row.Id)
		if err != nil {
			return nil, err
		}

		// Get time slots for this event
		timeSlots, err := db.getEventTimeSlots(ctx, row.Id)
		if err != nil {
			return nil, err
		}

		events[i] = api.Event{
			EventData: api.EventData{
				Id:              row.Id,
				UserId:          row.UserId,
				Locations:       locations,
				SkillLevel:      api.SkillLevel(row.SkillLevel),
				Description:     row.Description,
				EventType:       api.EventType(row.EventType),
				ExpectedPlayers: row.ExpectedPlayers,
				SessionDuration: row.SessionDuration,
				TimeSlots:       timeSlots,
				Visibility:      api.EventVisibility(row.Visibility),
			},
			Status:    api.EventStatus(row.Status),
			CreatedAt: row.CreatedAt,
		}
	}

	return events, nil
}

func (db *Db) getEventLocations(ctx context.Context, eventId string) ([]string, error) {
	query := `SELECT location_id FROM event_locations WHERE event_id = ?`
	var locations []string
	err := db.conn.SelectContext(ctx, &locations, query, eventId)
	if err != nil {
		slog.Error("Failed to get event locations", "error", err, "eventId", eventId)
		return nil, err
	}
	return locations, nil
}

func (db *Db) getEventTimeSlots(ctx context.Context, eventId string) ([]api.SessionTimeSlot, error) {
	query := `SELECT date, time FROM event_time_slots WHERE event_id = ?`
	var timeSlots []api.SessionTimeSlot
	err := db.conn.SelectContext(ctx, &timeSlots, query, eventId)
	if err != nil {
		slog.Error("Failed to get event time slots", "error", err, "eventId", eventId)
		return nil, err
	}
	return timeSlots, nil
}

func (db *Db) GetEvent(ctx context.Context, userId string, eventId string) (*api.Event, error) {
	events, err := db.getEventsInternal(ctx, userId, "e.id = ?", eventId)
	if err != nil {
		return nil, err
	}
	if len(events) == 0 {
		return nil, DbObjectNotFoundError{Message: "Event not found"}
	}
	return &events[0], nil
}
