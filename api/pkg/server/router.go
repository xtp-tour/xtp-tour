package server

import (
	"context"
	"database/sql"
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
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
	fizz        *fizz.Fizz
	port        int
	testStorage map[string]string
	db          *sql.DB
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
		fizz:        f,
		port:        config.Port,
		testStorage: map[string]string{},
		db:          dbConn,
	}
	r.init(config.AuthConfig)
	return r
}

func (r *Router) init(authConf pkg.AuthConfig) {

	// DEBUG STUFF
	r.testStorage["challenge 1"] = "test challenge 1"
	r.testStorage["challenge 2"] = "test challenge 2"
	r.testStorage["challenge 3"] = "test challenge 3"

	r.fizz.GET("/ping", nil, tonic.Handler(r.healthHandler, http.StatusOK))

	api := r.fizz.Group("/api", "API", "API operations")

	authMiddleware := auth.CreateAuthMiddleware(authConf)

	// Define routes here
	challenges := api.Group("/challenges", "Challenges", "Challenges operations", authMiddleware)

	challenges.PUT("/:name",
		[]fizz.OperationOption{fizz.Summary("Put a thing")},
		tonic.Handler(r.thingPutHandler, http.StatusCreated))

	challenges.GET("/", []fizz.OperationOption{fizz.Summary("Get list of challenges")}, tonic.Handler(r.listChallengesHandler, http.StatusOK))

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

func (r *Router) listChallengesHandler(c *gin.Context) (ListChallengesResponse, error) {
	return ListChallengesResponse{
		Challenges: r.testStorage,
	}, nil
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

func (r *Router) getChallengeHandler(c *gin.Context, req *GetChallengesRequest) (*GetChallengesResponse, error) {

	if val, ok := r.testStorage[req.Id]; ok {
		return &GetChallengesResponse{
			Result: val,
		}, nil
	} else {
		return nil, rest.HttpError{
			HttpCode: http.StatusNotFound,
			Message:  "Not found",
		}
	}
}

func (r *Router) thingPutHandler(c *gin.Context, req *ThingPutRequest) (*ThingPutResponse, error) {
	r.testStorage[req.Name] = req.Value
	return &ThingPutResponse{}, nil
}
