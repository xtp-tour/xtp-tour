package server

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"slices"
	"strings"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-gonic/gin"
	"github.com/loopfz/gadgeto/tonic"
	"github.com/xtp-tour/xtp-tour/api/cmd/version"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/api"
	"github.com/xtp-tour/xtp-tour/api/pkg/calendar"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest/auth"

	"github.com/wI2L/fizz"
	"github.com/wI2L/fizz/openapi"
)

type Notifier interface {
	EventConfirmed(logCtx *slog.Logger, eventId string, confirmedJoinReqIds []string, dateTime string, locationId string, hostUserId string)
	UserJoined(logCtx slog.Logger, userId string, joinRequest api.JoinRequestData)
}

type Router struct {
	fizz            *fizz.Fizz
	port            int
	db              *db.Db
	notifier        Notifier
	calendarService *calendar.Service
}

func (r *Router) Run() {
	slog.Info("Listening", "port", r.port)
	err := r.fizz.Engine().Run(fmt.Sprint(":", r.port))
	if err != nil {
		panic(err)
	}
}

func NewRouter(config *pkg.HttpConfig, dbConn *db.Db, debugMode bool, notifier Notifier) *Router {
	slog.Info("Cors Config", "cors", config.Cors)
	slog.Info("Auth config type", "type", config.AuthConfig.Type)

	f := rest.NewFizzRouter(config, debugMode)

	// Initialize calendar service
	calendarConfig := calendar.AuthConfig{
		ClientID:     config.GoogleCalendar.ClientID,
		ClientSecret: config.GoogleCalendar.ClientSecret,
		RedirectURL:  config.GoogleCalendar.RedirectURL,
		Scopes:       calendar.GetDefaultScopes(),
	}
	calendarService := calendar.NewService(calendarConfig, dbConn)

	r := &Router{
		fizz:            f,
		port:            config.Port,
		db:              dbConn,
		notifier:        notifier,
		calendarService: calendarService,
	}
	r.init(config.AuthConfig)

	return r
}

func (r *Router) init(authConf pkg.AuthConfig) {
	r.fizz.GET("/api/ping", nil, tonic.Handler(r.healthHandler, http.StatusOK))
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
	profiles.DELETE("/me", []fizz.OperationOption{fizz.Summary("Delete user profile")}, tonic.Handler(r.deleteUserProfileHandler, http.StatusOK))

	events := api.Group("/events", "Events", "Events operations", authMiddleware)
	events.POST("/", []fizz.OperationOption{fizz.Summary("Create an event")}, tonic.Handler(r.createEventHandler, http.StatusOK))
	events.GET("/", []fizz.OperationOption{fizz.Summary("Get list of events that belong to the user")}, tonic.Handler(r.listEventsHandler, http.StatusOK))
	events.GET("/joined", []fizz.OperationOption{fizz.Summary("Get list of events that the user joined")}, tonic.Handler(r.listJoinedEventsHandler, http.StatusOK))
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

	// Calendar integration endpoints
	calendar := api.Group("/calendar", "Calendar", "Google Calendar integration operations", authMiddleware)
	calendar.GET("/auth/url", []fizz.OperationOption{fizz.Summary("Get Google Calendar OAuth URL")}, tonic.Handler(r.getCalendarAuthURLHandler, http.StatusOK))
	// callback without auth
	r.fizz.GET("/api/calendar/auth/callback", []fizz.OperationOption{fizz.Summary("Handle Google Calendar OAuth callback")}, tonic.Handler(r.calendarCallbackHandler, http.StatusOK))
	//calendar.GET("/auth/callback", []fizz.OperationOption{fizz.Summary("Handle Google Calendar OAuth callback")}, tonic.Handler(r.calendarCallbackHandler, http.StatusOK))
	calendar.GET("/connection/status", []fizz.OperationOption{fizz.Summary("Get calendar connection status")}, tonic.Handler(r.getCalendarConnectionStatusHandler, http.StatusOK))
	calendar.DELETE("/connection", []fizz.OperationOption{fizz.Summary("Disconnect Google Calendar")}, tonic.Handler(r.disconnectCalendarHandler, http.StatusOK))
	calendar.GET("/busy-times", []fizz.OperationOption{fizz.Summary("Get busy times from calendar")}, tonic.Handler(r.getCalendarBusyTimesHandler, http.StatusOK))
	calendar.GET("/calendars", []fizz.OperationOption{fizz.Summary("Get list of user's calendars")}, tonic.Handler(r.getCalendarsHandler, http.StatusOK))
	calendar.GET("/preferences", []fizz.OperationOption{fizz.Summary("Get calendar preferences")}, tonic.Handler(r.getCalendarPreferencesHandler, http.StatusOK))
	calendar.PUT("/preferences", []fizz.OperationOption{fizz.Summary("Update calendar preferences")}, tonic.Handler(r.updateCalendarPreferencesHandler, http.StatusOK))
}

func (r *Router) healthHandler(c *gin.Context) (*api.HealthResponse, error) {
	resp := &api.HealthResponse{
		Service: fmt.Sprintf("%s@%s", pkg.ServiceName, version.Version),
		Status:  "OK",
	}

	err := r.db.Ping(context.Background())

	if err != nil {
		slog.Error("Database connection failed in health check", "error", err)
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

	logCtx := slog.With("userId", userId)

	req.Event.UserId = userId.(string)
	err := r.db.CreateEvent(context.Background(), &req.Event)
	if err != nil {
		logCtx.Error("Failed to create event", "error", err, "event", req.Event)
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

	logCtx := slog.With("userId", userId)

	events, err := r.db.GetEventsOfUser(context.Background(), userId.(string))
	if err != nil {
		logCtx.Error("Failed to get events of user", "error", err)
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
		logCtx.Error("Failed to get join requests", "error", err, "eventIds", eventIds)
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

func (r *Router) listJoinedEventsHandler(c *gin.Context, req *api.ListJoinedEventsRequest) (*api.ListEventsResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	return r.getJoinedEvents(userId.(string))
}

func (r *Router) listPublicEventsHandler(c *gin.Context, req *api.ListPublicEventsRequest) (*api.ListEventsResponse, error) {
	// Get user ID if available
	var userId string
	if userIdVal, ok := c.Get(auth.USER_ID_CONTEXT_KEY); ok {
		userId = userIdVal.(string)
	}

	events, err := r.db.GetPublicEvents(context.Background(), userId)
	if err != nil {
		slog.Error("Failed to get public events", "error", err, "userId", userId)
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
	logCtx := slog.With("userId", userId)

	events, err := r.db.GetJoinedEvents(context.Background(), userId)
	if err != nil {
		logCtx.Error("Failed to get joined events", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get events",
		}
	}

	for _, event := range events {
		var myReq *api.JoinRequest
		// multiple players can join. we want to show only current user's join request
		for _, r := range event.JoinRequests {
			if r.UserId == userId {
				myReq = r
			}
		}

		event.JoinRequests = make([]*api.JoinRequest, len(event.JoinRequests))
		myReq, err = r.db.GetJoinRequest(context.Background(), myReq.Id)
		if err != nil {
			logCtx.Error("Failed to get join request", "error", err, "joinRequestId", myReq.Id)
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

	logCtx := slog.With("userId", userId, "eventId", req.EventId)

	event, err := r.db.GetMyEvent(context.Background(), userId.(string), req.EventId)
	if err != nil {
		logCtx.Error("Failed to get my event", "error", err)
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
		logCtx.Error("Failed to get join requests", "error", err)
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
	logCtx := slog.With("eventId", req.EventId)

	event, err := r.db.GetPublicEvent(context.Background(), req.EventId)
	if err != nil {
		logCtx.Error("Failed to get public event", "error", err)
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

	logCtx := slog.With("userId", userId, "eventId", req.EventId)

	event, err := r.db.GetMyEvent(context.Background(), userId.(string), req.EventId)
	if err != nil {
		logCtx.Error("Failed to get my event for deletion", "error", err)
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

		logCtx.Error("Failed to delete event", "error", err)
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

	logCtx := slog.With("userId", userId, "eventId", req.EventId)

	joinRequestId, err := r.db.CreateJoinRequest(context.Background(), req.EventId, userId.(string), &req.JoinRequest)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return nil, rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Event not found",
			}
		}
		logCtx.Error("Failed to create join request", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to create join request",
		}
	}

	req.JoinRequest.Id = joinRequestId
	req.JoinRequest.EventId = req.EventId // Set eventId from path parameter

	// Notify about user joining
	notifyLogCtx := *slog.With("userId", userId, "eventId", req.EventId, "joinRequestId", joinRequestId)
	go r.notifier.UserJoined(notifyLogCtx, userId.(string), req.JoinRequest)

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

	logCtx := slog.With("userId", userId, "eventId", req.EventId, "joinRequestId", req.JoinRequestId)

	event, err := r.db.GetPublicEvent(context.Background(), req.EventId)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Event not found",
			}
		}

		logCtx.Error("Failed to get public event for cancel join request", "error", err)
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
		logCtx.Error("Failed to delete join request", "error", err)
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

	logCtx := slog.With("userId", userId)

	event, err := r.db.GetMyEvent(context.Background(), userId.(string), req.EventId)
	if err != nil {
		logCtx.Error("error to get event", "error", err)
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
		logCtx.Error("Failed to confirm event", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to confirm event",
		}
	}

	go r.notifier.EventConfirmed(logCtx, req.EventId, req.JoinRequestsIds, req.DateTime, req.LocationId, userId.(string))

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
	logCtx := slog.With("userId", userId)

	profile, err := r.db.GetUserProfile(c, userId)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			logCtx.Info("Profile not found")
			return nil, rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  fmt.Sprintf("Profile not found for user %s", userId),
			}
		}

		logCtx.Error("Failed to get user profile", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get profile",
		}
	}

	return &api.GetUserProfileResponse{
		UserId:  userId,
		Profile: profile,
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

	logCtx := slog.With("userId", userId)
	logCtx.Info("Creating user profile", "req", req)

	// Extract email and phone from Clerk user object if not provided in request
	if clerkUser, exists := c.Get("user"); exists {
		if usr, ok := clerkUser.(*clerk.User); ok {
			// Auto-populate email if not provided
			if req.Notifications.Email == "" && usr.PrimaryEmailAddressID != nil {
				for _, emailAddr := range usr.EmailAddresses {
					if emailAddr.ID == *usr.PrimaryEmailAddressID {
						req.Notifications.Email = emailAddr.EmailAddress
						logCtx.Info("Auto-populated email from Clerk", "email", emailAddr.EmailAddress)
						break
					}
				}
			}

			// Auto-populate phone if not provided
			if req.Notifications.PhoneNumber == "" && usr.PrimaryPhoneNumberID != nil {
				for _, phoneNum := range usr.PhoneNumbers {
					if phoneNum.ID == *usr.PrimaryPhoneNumberID {
						req.Notifications.PhoneNumber = phoneNum.PhoneNumber
						logCtx.Info("Auto-populated phone from Clerk", "phone", phoneNum.PhoneNumber)
						break
					}
				}
			}

			// Enable email channel by default if email is available
			if req.Notifications.Email != "" && req.Notifications.Channels == 0 {
				req.Notifications.Channels = 1 // Email channel enabled
			}
		}
	}

	_, profile, err := r.db.CreateUserProfile(c, userId.(string), req)
	if err != nil {
		logCtx.Error("Failed to create profile", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to create profile",
		}
	}

	return &api.CreateUserProfileResponse{
		UserId:  userId.(string),
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

	logCtx := slog.With("userId", userId)

	profile, err := r.db.UpdateUserProfile(context.Background(), userId.(string), &req.UserProfileData)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return nil, rest.HttpError{
				HttpCode: http.StatusNotFound,
				Message:  "Profile not found",
			}
		}
		logCtx.Error("Failed to update user profile", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to update profile",
		}
	}

	return &api.UpdateUserProfileResponse{
		UserId:  userId.(string),
		Profile: profile,
	}, nil
}

func (r *Router) deleteUserProfileHandler(c *gin.Context, req *api.DeleteUserProfileRequest) error {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		slog.Info("User ID not found in context")
		return rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}
	logCtx := slog.With("userId", userId)
	err := r.db.DeleteUserProfile(context.Background(), userId.(string))
	if err != nil {
		logCtx.Error("Failed to delete user profile", "error", err)
		return rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to delete profile",
		}
	}
	return nil

}

// Calendar handlers

func (r *Router) getCalendarAuthURLHandler(c *gin.Context) (*api.CalendarAuthURLResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	authURL := r.calendarService.GetAuthURL(userId.(string))

	return &api.CalendarAuthURLResponse{
		AuthURL: authURL,
	}, nil
}

func (r *Router) calendarCallbackHandler(c *gin.Context, req *api.CalendarCallbackRequest) error {

	// Validate request parameters
	if req.Code == "" {
		return rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Authorization code is required",
		}
	}

	if req.State == "" {
		return rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "State parameter is required",
		}
	}

	stateParts := strings.Split(req.State, ":")
	if len(stateParts) != 2 {
		return rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Invalid state parameter format",
		}
	}
	userId := stateParts[0]

	ctx := context.Background()
	err := r.calendarService.HandleCallback(ctx, userId, req.Code, req.State)
	if err != nil {
		slog.Error("Failed to handle calendar callback", "error", err, "userID", userId)
		return rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to connect calendar",
		}
	}

	return nil
}

func (r *Router) getCalendarConnectionStatusHandler(c *gin.Context) (*api.CalendarConnectionStatusResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	ctx := context.Background()
	connection, err := r.calendarService.GetConnectionStatus(ctx, userId.(string))
	if err != nil {
		slog.Error("Failed to get calendar connection status", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get connection status",
		}
	}

	if connection == nil {
		return &api.CalendarConnectionStatusResponse{
			Connected: false,
		}, nil
	}

	return &api.CalendarConnectionStatusResponse{
		Connected:   true,
		Provider:    connection.Provider,
		CalendarID:  connection.CalendarID,
		TokenExpiry: connection.TokenExpiry,
		CreatedAt:   connection.CreatedAt,
	}, nil
}

func (r *Router) disconnectCalendarHandler(c *gin.Context) error {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	ctx := context.Background()
	err := r.calendarService.DisconnectCalendar(ctx, userId.(string))
	if err != nil {
		slog.Error("Failed to disconnect calendar", "error", err)
		return rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to disconnect calendar",
		}
	}

	return nil
}

func (r *Router) getCalendarBusyTimesHandler(c *gin.Context, req *api.CalendarBusyTimesRequest) (*api.CalendarBusyTimesResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// The request struct binding handles parsing, so we can use the fields directly.
	timeMin := req.TimeMin
	timeMax := req.TimeMax

	ctx := context.Background()
	busyTimesResponse, err := r.calendarService.GetBusyTimes(ctx, userId.(string), timeMin, timeMax)
	if err != nil {
		slog.Error("Failed to get calendar busy times", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get busy times",
		}
	}

	// Convert calendar.BusyPeriod to api.CalendarBusyPeriod
	var busyPeriods []api.CalendarBusyPeriod
	for _, period := range busyTimesResponse.BusyPeriods {
		busyPeriods = append(busyPeriods, api.CalendarBusyPeriod{
			Start: period.Start,
			End:   period.End,
			Title: period.Title,
		})
	}

	return &api.CalendarBusyTimesResponse{
		BusyPeriods: busyPeriods,
		CalendarID:  busyTimesResponse.CalendarID,
		SyncedAt:    busyTimesResponse.SyncedAt,
	}, nil
}

func (r *Router) getCalendarsHandler(c *gin.Context) (*api.UserCalendarsResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	ctx := context.Background()
	calendars, err := r.calendarService.ListCalendars(ctx, userId.(string))
	if err != nil {
		slog.Error("Failed to list calendars", "error", err, "userID", userId.(string))
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to list calendars",
		}
	}

	var apiCalendars []api.UserCalendar
	for _, cal := range calendars {
		apiCalendars = append(apiCalendars, api.UserCalendar{
			ID:      cal.ID,
			Summary: cal.Summary,
			Primary: cal.Primary,
		})
	}

	return &api.UserCalendarsResponse{Calendars: apiCalendars}, nil
}

func (r *Router) getCalendarPreferencesHandler(c *gin.Context) (*api.CalendarPreferencesResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	ctx := context.Background()
	prefs, err := r.db.GetCalendarPreferences(ctx, userId.(string))
	if err != nil {
		slog.Error("Failed to get calendar preferences", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to get preferences",
		}
	}

	return &api.CalendarPreferencesResponse{
		SyncEnabled:          prefs.SyncEnabled,
		SyncFrequencyMinutes: prefs.SyncFrequencyMinutes,
		ShowEventDetails:     prefs.ShowEventDetails,
		UpdatedAt:            prefs.UpdatedAt,
	}, nil
}

func (r *Router) updateCalendarPreferencesHandler(c *gin.Context, req *api.CalendarPreferencesRequest) (*api.CalendarPreferencesResponse, error) {
	userId, ok := c.Get(auth.USER_ID_CONTEXT_KEY)
	if !ok {
		return nil, rest.HttpError{
			HttpCode: http.StatusUnauthorized,
			Message:  "User ID not found",
		}
	}

	// Validate sync frequency
	validFrequencies := []int{15, 30, 60, 120, 240, 480, 720, 1440} // 15min to 24hours
	isValidFreq := false
	for _, freq := range validFrequencies {
		if req.SyncFrequencyMinutes == freq {
			isValidFreq = true
			break
		}
	}

	if !isValidFreq {
		return nil, rest.HttpError{
			HttpCode: http.StatusBadRequest,
			Message:  "Invalid sync frequency. Must be one of: 15, 30, 60, 120, 240, 480, 720, 1440 minutes",
		}
	}

	ctx := context.Background()
	prefs := &db.UserCalendarPreferencesRow{
		UserId:               userId.(string),
		SyncEnabled:          req.SyncEnabled,
		SyncFrequencyMinutes: req.SyncFrequencyMinutes,
		ShowEventDetails:     req.ShowEventDetails,
		CreatedAt:            time.Now(),
		UpdatedAt:            time.Now(),
	}

	err := r.db.UpsertCalendarPreferences(ctx, prefs)
	if err != nil {
		slog.Error("Failed to update calendar preferences", "error", err)
		return nil, rest.HttpError{
			HttpCode: http.StatusInternalServerError,
			Message:  "Failed to update preferences",
		}
	}

	return &api.CalendarPreferencesResponse{
		SyncEnabled:          prefs.SyncEnabled,
		SyncFrequencyMinutes: prefs.SyncFrequencyMinutes,
		ShowEventDetails:     prefs.ShowEventDetails,
		UpdatedAt:            prefs.UpdatedAt,
	}, nil
}
