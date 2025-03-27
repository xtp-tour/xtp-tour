package server

import (
	"context"
	"database/sql"
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
	fizz         *fizz.Fizz
	port         int
	eventStorage map[string]*Event
	db           *sql.DB
}

func (r *Router) Run() {
	slog.Info("Listening", "port", r.port)
	err := r.fizz.Engine().Run(fmt.Sprint(":", r.port))
	if err != nil {
		panic(err)
	}
}

func NewRouter(config *pkg.HttpConfig, dbConn *sql.DB, debugMode bool) *Router {
	slog.Info("Cors Config", "cors", config.Cors)

	f := rest.NewFizzRouter(config, debugMode)

	r := &Router{
		fizz:         f,
		port:         config.Port,
		eventStorage: map[string]*Event{},
		db:           dbConn,
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

	err := r.db.Ping()

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
		location := Location{
			ID:      facility.ID,
			Name:    facility.Name,
			Address: facility.Address,
		}

		// Convert point (location) to coordinates if needed
		if facility.Location != (model.Point{}) {
			location.Coordinates = Coordinates{
				Latitude:  facility.Location.Lat,
				Longitude: facility.Location.Lng,
			}
		}

		locations = append(locations, location)
	}

	return &ListLocationsResponse{
		Locations: locations,
	}, nil
}

// Events
func (r *Router) createEventHandler(c *gin.Context, req *CreateEventRequest) (*CreateEventResponse, error) {
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

	r.eventStorage[req.Event.Id] = event

	return &CreateEventResponse{
		Event: event,
	}, nil
}

func (r *Router) listEventsHandler(c *gin.Context, req *ListEventsRequest) (*ListEventsResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// Filter events to only show those created by the user
	events := make([]Event, 0)
	for _, event := range r.eventStorage {
		if event.UserId == userId.(string) {
			events = append(events, *event)
		}
	}

	return &ListEventsResponse{
		Events: events,
		Total:  len(events),
	}, nil
}

func (r *Router) getEventHandler(c *gin.Context, req *GetEventRequest) (*GetEventResponse, error) {
	event, ok := r.eventStorage[req.Id]
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// Only allow event owner to view the event
	if event.UserId != userId.(string) {
		return nil, rest.HttpError{
			HttpCode: http.StatusForbidden,
			Message:  "Not authorized to view this event",
		}
	}

	return &GetEventResponse{Event: event}, nil
}

func (r *Router) deleteEventHandler(c *gin.Context, req *DeleteEventRequest) error {
	event, ok := r.eventStorage[req.Id]
	if !ok {
		return rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	if event.Status == EventStatusConfirmed {
		return rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Event is confirmed and cannot be deleted",
		}
	}

	delete(r.eventStorage, req.Id)
	return nil
}

func (r *Router) joinEventHandler(c *gin.Context, req *JoinRequestRequest) (*JoinRequestResponse, error) {
	event, ok := r.eventStorage[req.EventId]
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}
	userId, _ := c.Get(auth.USER_ID_CONTEXT_KEY)
	req.JoinRequest.Id = uuid.New().String()

	joinRequest := JoinRequest{
		JoinRequestData: req.JoinRequest,
		UserId:          userId.(string),
		Status:          JoinRequestStatusWaiting,
		CreatedAt:       time.Now().UTC(),
	}
	event.JoinRequests = append(event.JoinRequests, &joinRequest)

	return &JoinRequestResponse{
		JoinRequest: joinRequest,
	}, nil
}

func (r *Router) confirmEvent(c *gin.Context, req *EventConfirmationRequest) (*EventConfirmationResponse, error) {
	event, ok := r.eventStorage[req.EventId]
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// Check if user is event owner
	if event.UserId != userId.(string) {
		return nil, rest.HttpError{
			HttpCode: http.StatusForbidden,
			Message:  "Only event owner can confirm the event",
		}
	}

	// Validate location
	locationValid := false
	for _, loc := range event.Locations {
		if loc == req.LocationId {
			locationValid = true
			break
		}
	}
	if !locationValid {
		return nil, rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Invalid location selected",
		}
	}

	// Validate time slot
	timeSlotValid := false
	for _, slot := range event.TimeSlots {
		if slot.Date == req.Date && slot.Time == req.Time {
			timeSlotValid = true
			break
		}
	}
	if !timeSlotValid {
		return nil, rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Invalid time slot selected",
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

	// Update event status and create confirmation
	event.Status = EventStatusConfirmed
	event.Confirmation = &Confirmation{
		EventId:    event.Id,
		LocationId: req.LocationId,
		Date:       parsedDate,
		Time:       req.Time,
		Duration:   event.SessionDuration,
		CreatedAt:  time.Now().UTC(),
	}

	// Update join request statuses - only accept specified requests
	for _, joinReq := range event.JoinRequests {
		for _, acceptedId := range req.JoinRequestsIds {
			if joinReq.Id == acceptedId {
				joinReq.Status = JoinRequestStatusAccepted
				event.Confirmation.AcceptedRequests = append(event.Confirmation.AcceptedRequests, *joinReq)
				break
			}
		}
	}

	return &EventConfirmationResponse{
		Confirmation: *event.Confirmation,
	}, nil
}
