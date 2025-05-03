package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"slices"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/loopfz/gadgeto/tonic"
	"github.com/xtp-tour/xtp-tour/api/cmd/version"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/api"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest/auth"

	"github.com/wI2L/fizz"
	"github.com/wI2L/fizz/openapi"
)

type Router struct {
	fizz *fizz.Fizz
	port int
	db   *db.Db
}

func (r *Router) Run() {
	slog.Info("Listening", "port", r.port)
	err := r.fizz.Engine().Run(fmt.Sprint(":", r.port))
	if err != nil {
		panic(err)
	}
}

func NewRouter(config *pkg.HttpConfig, dbConn *db.Db, debugMode bool) *Router {
	slog.Info("Cors Config", "cors", config.Cors)
	slog.Info("Auth config type", "type", config.AuthConfig.Type)

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
	r.fizz.POST("/error", nil, tonic.Handler(r.errorHandler, http.StatusOK))

	api := r.fizz.Group("/api", "API", "API operations")
	r.fizz.Generator().SetSecuritySchemes(map[string]*openapi.SecuritySchemeOrRef{
		"Bearer": {
			SecurityScheme: &openapi.SecurityScheme{
				Type:   "http",
				Scheme: "bearer",
			},
		},
		"TestAuth": {
			SecurityScheme: &openapi.SecurityScheme{
				Type: "apiKey",
				In:   "header",
				Name: "Authentication",
			},
		},
	})

	r.fizz.OpenAPI(
		&openapi.Info{
			Title:       "XTP Tour API",
			Description: "API for XTP Tour",
			Version:     "1.0.0",
		},
		"json",
	)

	authMiddleware := auth.CreateAuthMiddleware(authConf)

	events := api.Group("/events", "Events", "Events operations", authMiddleware)
	events.POST("/", []fizz.OperationOption{fizz.Summary("Create an event")}, tonic.Handler(r.createEventHandler, http.StatusOK))
	events.GET("/", []fizz.OperationOption{fizz.Summary("Get list of events that belong to the user")}, tonic.Handler(r.listEventsHandler, http.StatusOK))
	events.GET("/public", []fizz.OperationOption{fizz.Summary("Get list of public events")}, tonic.Handler(r.listPublicEventsHandler, http.StatusOK))
	events.GET("/public/:id", []fizz.OperationOption{fizz.Summary("Get public event by id")}, tonic.Handler(r.getPublicEventHandler, http.StatusOK))
	events.GET("/joined", []fizz.OperationOption{fizz.Summary("Get list of events that user joined")}, tonic.Handler(r.listJoinedEventsHandler, http.StatusOK))

	events.GET("/:id", []fizz.OperationOption{fizz.Summary("Get event by id")}, tonic.Handler(r.getMyEventHandler, http.StatusOK))
	events.DELETE("/:id", []fizz.OperationOption{fizz.Summary("Delete event by id")}, tonic.Handler(r.deleteEventHandler, http.StatusOK))
	events.POST("/:eventId/join", []fizz.OperationOption{fizz.Summary("Join an event")}, tonic.Handler(r.joinEventHandler, http.StatusOK))
	events.POST("/:eventId/confirmation", []fizz.OperationOption{fizz.Summary("Confirm event")}, tonic.Handler(r.confirmEvent, http.StatusOK))

	locations := api.Group("/locations", "Locations", "Locations operations", authMiddleware)
	locations.GET("/", []fizz.OperationOption{fizz.Summary("Get list of locations"), fizz.Security(&openapi.SecurityRequirement{
		"Bearer": []string{},
	})}, tonic.Handler(r.listLocationsHandler, http.StatusOK))
}

func (r *Router) healthHandler(c *gin.Context) (*api.HealthResponse, error) {
	resp := &api.HealthResponse{
		Service: fmt.Sprintf("%s@%s", pkg.ServiceName, version.Version),
		Status:  "OK",
	}

	err := r.db.Ping(context.Background())

	if err != nil {
		resp.Status = "DB Connection Error"
		resp.Details = err.Error()
		return resp, nil
	}

	return resp, nil
}

func (r *Router) errorHandler(c *gin.Context) error {
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		slog.Error("Error reading request body for error handler", "error", err)
		return nil
	}

	// Try to parse as JSON
	var jsonBody map[string]interface{}
	if err := json.Unmarshal(body, &jsonBody); err == nil {
		// Create args slice with isJson flag
		args := []any{"isJson", true}
		// Add each key-value pair from the JSON
		for k, v := range jsonBody {
			args = append(args, k, v)
		}
		slog.Error("Frontend error", args...)
	} else {
		slog.Error("Frontend error", "isJson", false, "error", string(body))
	}
	return nil
}

func (r *Router) listLocationsHandler(c *gin.Context, req *api.ListLocationsRequest) (*api.ListLocationsResponse, error) {
	ctx := context.Background()

	// Get facilities from database
	facilities, err := r.db.GetAllFacilities(ctx)
	if err != nil {
		slog.Error("Failed to get facilities", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to retrieve locations",
		}
	}

	return &api.ListLocationsResponse{
		Locations: facilities,
	}, nil
}

// Events
func (r *Router) createEventHandler(c *gin.Context, req *api.CreateEventRequest) (*api.CreateEventResponse, error) {

	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	req.Event.UserId = userId.(string)
	err := r.db.CreateEvent(context.Background(), &req.Event)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to create event",
		}
	}

	return &api.CreateEventResponse{
		Event: &api.Event{
			EventData: req.Event,
		},
	}, nil
}

func (r *Router) listEventsHandler(c *gin.Context, req *api.ListEventsRequest) (*api.ListEventsResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	events, err := r.db.GetEventsOfUser(context.Background(), userId.(string))
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get events",
		}
	}

	return &api.ListEventsResponse{
		Events: events,
	}, nil
}

func (r *Router) listPublicEventsHandler(c *gin.Context, req *api.ListPublicEventsRequest) (*api.ListEventsResponse, error) {
	// Get user ID if available
	var userId string
	if userIdVal, ok := c.Get(auth.USER_ID_CONTEXT_KEY); ok {
		userId = userIdVal.(string)
	}

	events, err := r.db.GetPublicEvents(context.Background(), userId)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get events",
		}
	}

	return &api.ListEventsResponse{
		Events: events,
		Total:  len(events),
	}, nil
}

func (r *Router) listJoinedEventsHandler(c *gin.Context, req *api.ListPublicEventsRequest) (*api.ListEventsResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}
	events, err := r.db.GetAcceptedEvents(context.Background(), userId.(string))
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get events",
		}
	}
	return &api.ListEventsResponse{
		Events: events,
		Total:  len(events),
	}, nil
}

func (r *Router) getMyEventHandler(c *gin.Context, req *api.GetEventRequest) (*api.GetEventResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	event, err := r.db.GetMyEvent(context.Background(), userId.(string), req.Id)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get event",
		}
	}

	if event == nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	return &api.GetEventResponse{
		Event: event,
	}, nil
}

func (r *Router) getPublicEventHandler(c *gin.Context, req *api.GetEventRequest) (*api.GetEventResponse, error) {
	_, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	event, err := r.db.GetPublicEvent(context.Background(), req.Id)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get event",
		}
	}

	return &api.GetEventResponse{
		Event: event,
	}, nil
}

func (r *Router) deleteEventHandler(c *gin.Context, req *api.DeleteEventRequest) error {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	event, err := r.db.GetMyEvent(context.Background(), userId.(string), req.Id)
	if err != nil {
		return rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get event",
		}
	}

	if event == nil {
		return rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	if event.Status == api.EventStatusConfirmed {
		return rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Cannot delete confirmed event",
		}
	}

	err = r.db.DeleteEvent(context.Background(), userId.(string), req.Id)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Event not found",
			}
		}

		slog.Error("Failed to delete event", "error", err, "eventId", req.Id, "userId", userId)
		return rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to delete event",
		}
	}

	return nil
}

func (r *Router) joinEventHandler(c *gin.Context, req *api.JoinRequestRequest) (*api.JoinRequestResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	err := r.db.CreateJoinRequest(context.Background(), req.EventId, userId.(string), &req.JoinRequest)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return nil, rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Event not found",
			}
		}
		slog.Error("Failed to create join request", "error", err, "eventId", req.EventId, "userId", userId)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to create join request",
		}
	}

	return &api.JoinRequestResponse{
		JoinRequest: api.JoinRequest{
			JoinRequestData: req.JoinRequest,
			UserId:          userId.(string),
			Status:          api.JoinRequestStatusWaiting,
			CreatedAt:       api.DtToIso(time.Now()),
		},
	}, nil
}

func (r *Router) confirmEvent(c *gin.Context, req *api.EventConfirmationRequest) (*api.EventConfirmationResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	event, err := r.db.GetMyEvent(context.Background(), userId.(string), req.EventId)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get event",
		}
	}

	if event == nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Event not found",
		}
	}

	if !slices.Contains(event.Locations, req.LocationId) {
		return nil, rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Location not found",
		}
	}

	if !slices.Contains(event.TimeSlots, req.DateTime) {
		return nil, rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Time slot not found",
		}
	}

	confirmation, err := r.db.ConfirmEvent(context.Background(), userId.(string), req.EventId, req)
	if err != nil {
		if validationErr, ok := err.(*db.ValidationError); ok {
			return nil, rest.HttpError{
				HttpCode: http.StatusBadRequest,
				Message:  validationErr.Message,
			}
		}
		slog.Error("Failed to confirm event", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to confirm event",
		}
	}

	return &api.EventConfirmationResponse{
		Confirmation: *confirmation,
	}, nil
}
