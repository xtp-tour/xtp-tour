package server

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"

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
	events.GET("/:id", []fizz.OperationOption{fizz.Summary("Get event by id")}, tonic.Handler(r.getEventHandler, http.StatusOK))
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

func (r *Router) getEventHandler(c *gin.Context, req *api.GetEventRequest) (*api.GetEventResponse, error) {
	panic("not implemented")

}

func (r *Router) deleteEventHandler(c *gin.Context, req *api.DeleteEventRequest) error {

	panic("not implemented")
}

func (r *Router) joinEventHandler(c *gin.Context, req *api.JoinRequestRequest) (*api.JoinRequestResponse, error) {
	panic("not implemented")
}

func (r *Router) confirmEvent(c *gin.Context, req *api.EventConfirmationRequest) (*api.EventConfirmationResponse, error) {

	panic("not implemented")

}
