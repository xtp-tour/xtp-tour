package server

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/loopfz/gadgeto/tonic"
	"github.com/xtp-tour/xtp-tour/api/cmd/version"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"github.com/xtp-tour/xtp-tour/api/pkg/db/model"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest/auth"

	"github.com/wI2L/fizz"
)

type Router struct {
	fizz *fizz.Fizz
	port int
	db   model.DB
}

func (r *Router) Run() {
	slog.Info("Listening", "port", r.port)
	err := r.fizz.Engine().Run(fmt.Sprint(":", r.port))
	if err != nil {
		panic(err)
	}
}

func NewRouter(config *pkg.HttpConfig, dbConn model.DB, debugMode bool) *Router {
	slog.Info("Cors Config", "cors", config.Cors)

	f := rest.NewFizzRouter(config, debugMode)

	r := &Router{
		fizz: f,
		port: config.Port,
		db:   dbConn,
	}
	r.init(config.AuthConfig)
	return r
}

func (r *Router) init(authConf pkg.AuthConfig) {
	r.fizz.GET("/ping", nil, tonic.Handler(r.healthHandler, http.StatusOK))

	api := r.fizz.Group("/api", "API", "API operations")

	authMiddleware := auth.CreateAuthMiddleware(authConf)

	events := api.Group("/events", "Events", "Events operations", authMiddleware)
	events.POST("/", []fizz.OperationOption{fizz.Summary("Create an event")}, tonic.Handler(r.createEventHandler, http.StatusCreated))
	events.GET("/", []fizz.OperationOption{fizz.Summary("Get list of events")}, tonic.Handler(r.listEventsHandler, http.StatusOK))
	events.GET("/:id", []fizz.OperationOption{fizz.Summary("Get event by id")}, tonic.Handler(r.getEventHandler, http.StatusOK))
	events.DELETE("/:id", []fizz.OperationOption{fizz.Summary("Delete event by id")}, tonic.Handler(r.deleteEventHandler, http.StatusOK))
	events.POST("/:eventId/join", []fizz.OperationOption{fizz.Summary("Join an event")}, tonic.Handler(r.joinEventHandler, http.StatusOK))
	events.POST("/:eventId/confirmation", []fizz.OperationOption{fizz.Summary("Confirm event")}, tonic.Handler(r.confirmEvent, http.StatusOK))

	locations := api.Group("/locations", "Locations", "Locations operations", authMiddleware)
	locations.GET("/", []fizz.OperationOption{fizz.Summary("Get list of locations")}, tonic.Handler(r.listLocationsHandler, http.StatusOK))
}

func (r *Router) healthHandler(c *gin.Context) (*HealthResponse, error) {
	resp := &HealthResponse{
		Service: fmt.Sprintf("%s@%s", pkg.ServiceName, version.Version),
		Status:  "OK",
	}

	_, err := r.db.QueryContext(context.Background(), "SELECT 1")

	if err != nil {
		resp.Status = "DB Connection Error"
		resp.Details = err.Error()
		return resp, nil
	}

	return resp, nil
}

func (r *Router) listLocationsHandler(c *gin.Context, req *ListLocationsRequest) (*ListLocationsResponse, error) {
	ctx := context.Background()

	// Get facilities from database
	facilities, err := db.GetAllFacilities(ctx, r.db)
	if err != nil {
		slog.Error("Failed to get facilities", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to retrieve locations",
		}
	}

	// Map facilities to API response
	locations := make([]Location, 0, len(facilities))
	for _, facility := range facilities {
		locations = append(locations, DBToAPILocation(facility))
	}

	return &ListLocationsResponse{
		Locations: locations,
	}, nil
}

// Events
func (r *Router) createEventHandler(c *gin.Context, req *CreateEventRequest) (*CreateEventResponse, error) {
	ctx := context.Background()
	req.Event.Id = uuid.New().String()

	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	event := &Event{
		EventData: req.Event,
		Status:    EventStatusOpen,
		CreatedAt: time.Now().UTC(),
		UserId:    userId.(string),
	}

	// Convert to DB model and save
	dbEvent := APIToDBEvent(event)
	if err := dbEvent.Insert(ctx, r.db); err != nil {
		slog.Error("Failed to create event", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to create event",
		}
	}

	return &CreateEventResponse{
		Event: event,
	}, nil
}

func (r *Router) listEventsHandler(c *gin.Context, req *ListEventsRequest) (*ListEventsResponse, error) {
	ctx := context.Background()

	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// Query events from database
	query := `SELECT id, user_id, skill_level, description, event_type, expected_players, session_duration, status, created_at, updated_at FROM xtp_tour.events WHERE user_id = ?`
	rows, err := r.db.QueryContext(ctx, query, userId)
	if err != nil {
		slog.Error("Failed to query events", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to retrieve events",
		}
	}
	defer rows.Close()

	var events []Event
	for rows.Next() {
		var dbEvent model.Event
		if err := rows.Scan(&dbEvent.ID, &dbEvent.UserID, &dbEvent.SkillLevel, &dbEvent.Description, &dbEvent.EventType, &dbEvent.ExpectedPlayers, &dbEvent.SessionDuration, &dbEvent.Status, &dbEvent.CreatedAt, &dbEvent.UpdatedAt); err != nil {
			slog.Error("Failed to scan event", "error", err)
			return nil, rest.HttpError{
				HttpCode: http.StatusInternalServerError,
				Message:  "Failed to process events",
			}
		}
		events = append(events, *DBToAPIEvent(&dbEvent))
	}

	return &ListEventsResponse{
		Events: events,
		Total:  len(events),
	}, nil
}

func (r *Router) getEventHandler(c *gin.Context, req *GetEventRequest) (*GetEventResponse, error) {
	ctx := context.Background()

	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// Get event from database
	dbEvent, err := model.EventByID(ctx, r.db, req.Id)
	if err != nil {
		slog.Error("Failed to get event", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	// Check ownership
	if dbEvent.UserID != userId.(string) {
		return nil, rest.HttpError{
			HttpCode: http.StatusForbidden,
			Message:  "Not authorized to view this event",
		}
	}

	return &GetEventResponse{
		Event: DBToAPIEvent(dbEvent),
	}, nil
}

func (r *Router) deleteEventHandler(c *gin.Context, req *DeleteEventRequest) error {
	ctx := context.Background()

	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// Get event from database
	dbEvent, err := model.EventByID(ctx, r.db, req.Id)
	if err != nil {
		slog.Error("Failed to get event", "error", err)
		return rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	// Check ownership
	if dbEvent.UserID != userId.(string) {
		return rest.HttpError{
			HttpCode: http.StatusForbidden,
			Message:  "Not authorized to delete this event",
		}
	}

	// Check status
	if dbEvent.Status == model.StatusConfirmed {
		return rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Event is confirmed and cannot be deleted",
		}
	}

	// Delete event
	if err := dbEvent.Delete(ctx, r.db); err != nil {
		slog.Error("Failed to delete event", "error", err)
		return rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to delete event",
		}
	}

	return nil
}

func (r *Router) joinEventHandler(c *gin.Context, req *JoinRequestRequest) (*JoinRequestResponse, error) {
	ctx := context.Background()

	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// Get event from database
	_, err := model.EventByID(ctx, r.db, req.EventId)
	if err != nil {
		slog.Error("Failed to get event", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	req.JoinRequest.Id = uuid.New().String()
	joinRequest := JoinRequest{
		JoinRequestData: req.JoinRequest,
		UserId:          userId.(string),
		Status:          JoinRequestStatusWaiting,
		CreatedAt:       time.Now().UTC(),
	}

	// Convert to DB model and save
	dbJoinRequest := APIToDBJoinRequest(&joinRequest, req.EventId)
	if err := dbJoinRequest.Insert(ctx, r.db); err != nil {
		slog.Error("Failed to create join request", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to create join request",
		}
	}

	return &JoinRequestResponse{
		JoinRequest: joinRequest,
	}, nil
}

func (r *Router) confirmEvent(c *gin.Context, req *EventConfirmationRequest) (*EventConfirmationResponse, error) {
	ctx := context.Background()

	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// Get event from database
	dbEvent, err := model.EventByID(ctx, r.db, req.EventId)
	if err != nil {
		slog.Error("Failed to get event", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	// Check ownership
	if dbEvent.UserID != userId.(string) {
		return nil, rest.HttpError{
			HttpCode: http.StatusForbidden,
			Message:  "Only event owner can confirm the event",
		}
	}

	// Validate location
	_, err = model.EventLocationByEventIDLocationID(ctx, r.db, req.EventId, req.LocationId)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Invalid location selected",
		}
	}

	// Parse the date string into time.Time
	parsedDate, err := time.Parse("2006-01-02", req.Date)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Invalid date format",
		}
	}

	// Create confirmation
	confirmation := &Confirmation{
		EventId:    req.EventId,
		LocationId: req.LocationId,
		Date:       parsedDate,
		Time:       req.Time,
		Duration:   dbEvent.SessionDuration,
		CreatedAt:  time.Now().UTC(),
	}

	// Convert to DB model and save
	dbConfirmation := APIToDBConfirmation(confirmation)
	if err := dbConfirmation.Insert(ctx, r.db); err != nil {
		slog.Error("Failed to create confirmation", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to create confirmation",
		}
	}

	// Update event status
	dbEvent.Status = model.StatusConfirmed
	if err := dbEvent.Update(ctx, r.db); err != nil {
		slog.Error("Failed to update event status", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to update event status",
		}
	}

	// Update join request statuses
	for _, joinReqId := range req.JoinRequestsIds {
		dbJoinRequest, err := model.JoinRequestByID(ctx, r.db, joinReqId)
		if err != nil {
			slog.Error("Failed to get join request", "error", err)
			continue
		}
		dbJoinRequest.Status = model.StatusAccepted
		if err := dbJoinRequest.Update(ctx, r.db); err != nil {
			slog.Error("Failed to update join request status", "error", err)
			continue
		}
		confirmation.AcceptedRequests = append(confirmation.AcceptedRequests, *DBToAPIJoinRequest(dbJoinRequest))
	}

	return &EventConfirmationResponse{
		Confirmation: *confirmation,
	}, nil
}
