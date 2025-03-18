package server

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/loopfz/gadgeto/tonic"
	"github.com/xtp-tour/xtp-tour/api/cmd/version"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest"

	"github.com/wI2L/fizz"
)

type Router struct {
	fizz        *fizz.Fizz
	port        int
	testStorage map[string]string
}

func (r *Router) Run() {
	slog.Info("Listening", "port", r.port)
	err := r.fizz.Engine().Run(fmt.Sprint(":", r.port))
	if err != nil {
		panic(err)
	}
}

func NewRouter(config *pkg.HttpConfig, debugMode bool) *Router {
	slog.Info("Cors Config", "cors", config.Cors)

	f := rest.NewFizzRouter(config, pkg.ServiceName, version.Version, debugMode)

	r := &Router{
		fizz:        f,
		port:        config.Port,
		testStorage: map[string]string{},
	}
	r.init(config.AuthConfig)
	return r
}

func (r *Router) init(authConf pkg.AuthConfig) {

	// DEBUG STUFF
	r.testStorage["challenge 1"] = "test challenge 1"
	r.testStorage["challenge 2"] = "test challenge 2"
	r.testStorage["challenge 3"] = "test challenge 3"
	api := r.fizz.Group("/api", "API", "API operations")

	// Define routes here
	challenges := api.Group("/challenges", "Challenges", "Challenges operations", rest.AuthMiddleware(authConf))

	challenges.PUT("/:name",
		[]fizz.OperationOption{fizz.Summary("Put a thing")},
		tonic.Handler(r.thingPutHandler, http.StatusCreated))

	challenges.GET("/", []fizz.OperationOption{fizz.Summary("Get list of challenges")}, tonic.Handler(r.listChallengesHandler, http.StatusOK))

	locations := api.Group("/locations", "Locations", "Locations operations", rest.AuthMiddleware(authConf))
	locations.GET("/", []fizz.OperationOption{fizz.Summary("Get list of locations")}, tonic.Handler(r.listLocationsHandler, http.StatusOK))
}

func (r *Router) listChallengesHandler(c *gin.Context) (ListChallengesResponse, error) {
	return ListChallengesResponse{
		Challenges: r.testStorage,
	}, nil
}

func (r *Router) listLocationsHandler(c *gin.Context, req *ListLocationsRequest) (*ListLocationsResponse, error) {
	return &ListLocationsResponse{
		Locations: []Location{
			{
				ID:          "1",
				Name:        "Location 1",
				Area:        "Area 1",
				Address:     "Address 1",
				Coordinates: Coordinates{Latitude: 1.0, Longitude: 2.0},
			},
			{
				ID:      "2",
				Name:    "Location 2",
				Area:    "Area 2",
				Address: "Address 2",
			},
			{
				ID:      "3",
				Name:    "Location 3",
				Area:    "Area 3",
				Address: "Address 3",
			},
		},
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
