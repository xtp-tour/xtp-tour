package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"os"
	"path/filepath"
	"slices"
	"strings"
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

	// Check if frontend path is set in environment
	frontendPath := os.Getenv("FRONTEND_PATH")
	if frontendPath != "" {
		slog.Info("Frontend static files will be served from", "path", frontendPath)
		r.setupFrontendStaticFiles(frontendPath)
	}

	return r
}

// setupFrontendStaticFiles configures the router to serve frontend static files
func (r *Router) setupFrontendStaticFiles(frontendPath string) {
	engine := r.fizz.Engine()

	// Serve static files
	engine.Static("/assets", filepath.Join(frontendPath, "assets"))

	// For any other routes, serve the index.html file for SPA routing
	engine.NoRoute(func(c *gin.Context) {
		// Skip API paths
		path := c.Request.URL.Path
		if strings.HasPrefix(path, "/api") {
			c.Next()
			return
		}

		// Serve index.html for all other routes
		indexPath := filepath.Join(frontendPath, "index.html")
		c.File(indexPath)
	})
}

func (r *Router) init(authConf pkg.AuthConfig) {
	r.fizz.GET("/ping", nil, tonic.Handler(r.healthHandler, http.StatusOK))
	r.fizz.POST("/api/error", nil, tonic.Handler(r.errorHandler, http.StatusOK))

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

	profiles := api.Group("/profiles", "Profiles", "Profiles operations", authMiddleware)
	profiles.GET("/me", []fizz.OperationOption{fizz.Summary("Get user profile")}, tonic.Handler(r.getMyProfileHandler, http.StatusOK))
	profiles.GET("/:user", []fizz.OperationOption{fizz.Summary("Get user profile")}, tonic.Handler(r.getUserProfileHandler, http.StatusOK))
	profiles.POST("/", []fizz.OperationOption{fizz.Summary("Create user profile")}, tonic.Handler(r.createUserProfileHandler, http.StatusOK))
	profiles.PUT("/me", []fizz.OperationOption{fizz.Summary("Update user profile")}, tonic.Handler(r.updateUserProfileHandler, http.StatusOK))

	events := api.Group("/events", "Events", "Events operations", authMiddleware)
	events.POST("/", []fizz.OperationOption{fizz.Summary("Create an event")}, tonic.Handler(r.createEventHandler, http.StatusOK))
	events.GET("/", []fizz.OperationOption{fizz.Summary("Get list of events that belong to the user")}, tonic.Handler(r.listEventsHandler, http.StatusOK))
	events.GET("/:eventId", []fizz.OperationOption{fizz.Summary("Get event by id")}, tonic.Handler(r.getMyEventHandler, http.StatusOK))
	events.DELETE("/:eventId", []fizz.OperationOption{fizz.Summary("Delete event by id")}, tonic.Handler(r.deleteEventHandler, http.StatusOK))
	events.POST("/:eventId/confirmation", []fizz.OperationOption{fizz.Summary("Confirm event")}, tonic.Handler(r.confirmEvent, http.StatusOK))

	// those does not require auth
	api.GET("/events/public", []fizz.OperationOption{fizz.Summary("Get list of public events")}, tonic.Handler(r.listPublicEventsHandler, http.StatusOK))
	api.GET("/events/public/:eventId", []fizz.OperationOption{fizz.Summary("Get public event by id")}, tonic.Handler(r.getPublicEventHandler, http.StatusOK))

	public := events.Group("/public", "Public events", "Public events and their operations")
	public.POST("/:eventId/joins", []fizz.OperationOption{fizz.Summary("Join an event")}, tonic.Handler(r.joinEventHandler, http.StatusOK))
	public.DELETE("/:eventId/joins/:joinRequestId", []fizz.OperationOption{fizz.Summary("Cancel join request")}, tonic.Handler(r.cancelJoinRequest, http.StatusOK))

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
		args := []any{"isJson", true, "source", "frontend"}
		// Add each key-value pair from the JSON
		for k, v := range jsonBody {
			args = append(args, k, v)
		}
		slog.Error("FrontendError", args...)
	} else {
		slog.Error("FrontendError", "isJson", false, "source", "frontend", "error", string(body))
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

	eventIds := make([]string, len(events))
	for i, event := range events {
		eventIds[i] = event.Id
	}
	joinRequests, err := r.db.GetJoinRequests(context.Background(), eventIds...)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get join requests",
		}
	}

	for _, event := range events {
		event.JoinRequests = joinRequests[event.Id]
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

	// list of events that user joined
	if req.Joined {
		return r.getJoinedEvents(userId)
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

func (r *Router) getJoinedEvents(userId string) (*api.ListEventsResponse, error) {
	events, err := r.db.GetJoinedEvents(context.Background(), userId)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get events",
		}
	}

	for _, event := range events {
		var myReq *api.JoinRequest
		for _, r := range event.JoinRequests {
			if r.UserId == userId {
				myReq = r
			}
		}

		event.JoinRequests = make([]*api.JoinRequest, len(event.JoinRequests))
		myReq, err = r.db.GetJoinRequest(context.Background(), myReq.Id)
		if err != nil {
			return nil, rest.HttpError{
				HttpCode: http.StatusInternalServerError,
				Message:  "Failed to get join request",
			}
		}
		event.JoinRequests[0] = myReq

		for i := 1; i < len(event.JoinRequests); i++ {
			event.JoinRequests[i] = &api.JoinRequest{
				UserId: fmt.Sprintf("masked-user-id-%d", i),
			}
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

	joinRequests, err := r.db.GetJoinRequests(context.Background(), event.Id)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get join requests",
		}
	}

	event.JoinRequests = joinRequests[event.Id]

	return &api.GetEventResponse{
		Event: event,
	}, nil
}

func (r *Router) getPublicEventHandler(c *gin.Context, req *api.GetEventRequest) (*api.GetEventResponse, error) {

	event, err := r.db.GetPublicEvent(context.Background(), req.EventId)
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

	event, err := r.db.GetMyEvent(context.Background(), userId.(string), req.EventId)
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

	err = r.db.DeleteEvent(context.Background(), userId.(string), req.EventId)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Event not found",
			}
		}

		slog.Error("Failed to delete event", "error", err, "eventId", req.EventId, "userId", userId)
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

	joinRequestId, err := r.db.CreateJoinRequest(context.Background(), req.EventId, userId.(string), &req.JoinRequest)
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

	req.JoinRequest.Id = joinRequestId
	return &api.JoinRequestResponse{
		JoinRequest: api.JoinRequest{
			JoinRequestData: req.JoinRequest,
			UserId:          userId.(string),
			CreatedAt:       api.DtToIso(time.Now()),
		},
	}, nil
}

func (r *Router) cancelJoinRequest(c *gin.Context, req *api.CancelJoinRequestRequest) error {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	event, err := r.db.GetPublicEvent(context.Background(), req.EventId)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Event not found",
			}
		}

		return rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get event",
		}
	}

	if event.Status != api.EventStatusOpen {
		return rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Cannot cancel join request for non-open event",
		}
	}

	err = r.db.DeleteJoinRequest(context.Background(), userId.(string), req.JoinRequestId)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Join request not found",
			}
		}
		slog.Error("Failed to delete join request", "error", err, "joinRequestId", req.JoinRequestId, "userId", userId)
		return rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to delete join request",
		}
	}

	return nil
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

// Profiles
func (r *Router) getMyProfileHandler(c *gin.Context, req *api.GetMyProfileRequest) (*api.GetUserProfileResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	return r.getUserProfile(c, userId.(string))
}

func (r *Router) getUserProfileHandler(c *gin.Context, req *api.GetUserProfileRequest) (*api.GetUserProfileResponse, error) {
	return r.getUserProfile(c, req.UserId)
}

func (r *Router) getUserProfile(c *gin.Context, userId string) (*api.GetUserProfileResponse, error) {
	profile, err := r.db.GetUserProfile(c, userId)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return nil, rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Profile not found",
			}
		}

		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get profile",
		}
	}

	return &api.GetUserProfileResponse{
		Profile: &api.UserProfileData{
			UserId:        userId,
			FirstName:     profile.FirstName,
			LastName:      profile.LastName,
			NTRPLevel:     profile.NTRPLevel,
			PreferredCity: profile.PreferredCity,
		},
	}, nil
}

func (r *Router) createUserProfileHandler(c *gin.Context, req *api.CreateUserProfileRequest) (*api.CreateUserProfileResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	profile, err := r.db.CreateUserProfile(c, userId.(string), req)
	if err != nil {
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to create profile",
		}
	}

	return &api.CreateUserProfileResponse{
		Profile: profile,
	}, nil
}

func (r *Router) updateUserProfileHandler(c *gin.Context, req *api.UpdateUserProfileRequest) (*api.UpdateUserProfileResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	profile, err := r.db.UpdateUserProfile(context.Background(), userId.(string), &req.UserProfileData)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return nil, rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Profile not found",
			}
		}
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to update profile",
		}
	}

	return &api.UpdateUserProfileResponse{
		Profile: profile,
	}, nil
}
