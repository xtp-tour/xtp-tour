//go:build servicetest
// +build servicetest

package stest

import (
	"fmt"
	"log/slog"
	"net/http"
	"testing"

	"github.com/go-resty/resty/v2"
	"github.com/num30/config"
	"github.com/stretchr/testify/assert"
	"github.com/xtp-tour/xtp-tour/api/pkg/api"
)

type TestConfig struct {
	LogLevel    string `default:"info" envvar:"LOG_LEVEL"`
	ServiceHost string `default:"http://localhost:8080" envvar:"SERVICE_HOST"`
	MetricsHost string `default:"http://localhost:10250" envvar:"METRICS_HOST"`
}

var tConfig = &TestConfig{}
var restClient = resty.New()

func init() {
	err := config.NewConfReader("service_test").Read(tConfig)
	if err != nil {
		slog.With("error", err).Error("Error reading config")
	}
}

func Test_Ping(t *testing.T) {
	t.Run("Ping", func(t *testing.T) {
		r, err := restClient.R().Get(tConfig.ServiceHost + "/ping")
		assert.NoError(t, err)
		assert.Equal(t, r.StatusCode(), http.StatusOK)
	})
}

// Check that prometheus metrics are available
func Test_GetMetrics(t *testing.T) {
	t.Run("Metrics", func(t *testing.T) {
		r, err := restClient.R().Get(tConfig.MetricsHost + "/metrics")
		if assert.NoError(t, err) {
			assert.Equal(t, http.StatusOK, r.StatusCode())
			assert.Contains(t, string(r.Body()), "things_requests_total")
		}
	})
}

// Test API endpoints with debug authorization
func Test_EventAPI(t *testing.T) {
	user := "test-user-1"
	user2 := "test-user-2"
	user3 := "test-user-3"
	var eventId string

	// Create an event
	t.Run("CreateEvent", func(tt *testing.T) {
		eventData := api.CreateEventRequest{
			Event: api.EventData{
				Locations:       []string{"matchpoint", "spartan-pultuska"},
				SkillLevel:      api.SkillLevelIntermediate,
				EventType:       api.ActivityTypeMatch,
				ExpectedPlayers: 2,
				SessionDuration: 60,
				TimeSlots: []api.SessionTimeSlot{
					{Date: "2023-10-15", Time: 14},
					{Date: "2023-10-16", Time: 16},
					{Date: "2023-10-17", Time: 18},
					{Date: "2023-10-17", Time: 19},
				},
				Description: "Test event for integration testing",
				Visibility:  api.EventVisibilityPublic,
			},
		}

		var response api.CreateEventResponse

		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetBody(eventData).
			SetResult(&response).
			Post(tConfig.ServiceHost + "/api/events/")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			if assert.NotNil(tt, response.Event) {
				eventId = response.Event.Id
			}
		}

	})

	// List events
	t.Run("ListEventsOfUser", func(tt *testing.T) {
		var response api.ListEventsResponse
		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/events/")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			assert.Greater(tt, len(response.Events), 0, "No events found")
			exist := false
			for _, e := range response.Events {
				if e.Id == eventId {
					exist = true
					break
				}
			}
			assert.True(tt, exist, "Event ID should exist in the list of events")
		}
	})

	// Get event by ID
	t.Run("GetEvent", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		r, err := restClient.R().
			SetHeader("Authentication", user).
			Get(tConfig.ServiceHost + "/api/events/" + eventId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			assert.Contains(tt, string(r.Body()), `"id":"`+eventId+`"`)
			assert.Contains(tt, string(r.Body()), `"description":"Test event for integration testing"`)
		}
	})

	var joinRequestId string

	// Join an event
	t.Run("JoinEvent1", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		joinRequestData := api.JoinRequestRequest{
			JoinRequest: api.JoinRequestData{
				Locations: []string{"matchpoint"},
				TimeSlots: []api.SessionTimeSlot{
					{Date: "2023-10-15", Time: 14},
					{Date: "2023-10-16", Time: 16},
				},
				Comment: "Hey, let's play",
			},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user2).
			SetBody(joinRequestData).
			Post(tConfig.ServiceHost + "/api/events/" + eventId + "/join")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("JoinEvent2AllOptionsSelected", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		joinRequestData := api.JoinRequestRequest{
			JoinRequest: api.JoinRequestData{
				Locations: []string{"matchpoint", "spartan-pultuska"},
				TimeSlots: []api.SessionTimeSlot{
					{Date: "2023-10-15", Time: 14},
					{Date: "2023-10-16", Time: 16},
					{Date: "2023-10-17", Time: 18},
					{Date: "2023-10-17", Time: 19},
				},
				Comment: "Let's play tennis!",
			},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user3).
			SetBody(joinRequestData).
			Post(tConfig.ServiceHost + "/api/events/" + eventId + "/join")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("GetEvent", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		var response api.GetEventResponse
		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/events/" + eventId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			assert.Equal(tt, response.Event.Id, eventId)
			assert.Equal(tt, response.Event.Status, api.EventStatusOpen)
			assert.Len(tt, response.Event.JoinRequests, 2)
			joinRequestId = response.Event.JoinRequests[0].Id
		}
	})

	t.Run("Confirm event by not owner", func(tt *testing.T) {
		if eventId == "" || joinRequestId == "" {
			assert.Fail(tt, fmt.Sprintf("Event ID or join request ID is not available. Event ID: %s, join request ID: %s", eventId, joinRequestId))
		}

		confirmation := api.EventConfirmationRequest{
			EventId:         eventId,
			LocationId:      "matchpoint",
			Date:            "2023-10-15",
			Time:            14,
			Duration:        60,
			JoinRequestsIds: []string{joinRequestId},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user2).
			SetBody(confirmation).
			Post(tConfig.ServiceHost + "/api/events/" + eventId + "/confirmation")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusForbidden, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("Confirm event by owner with invalid time slot", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		confirmation := api.EventConfirmationRequest{
			EventId:         eventId,
			LocationId:      "matchpoint",
			Date:            "2023-05-15",
			Time:            14,
			Duration:        60,
			JoinRequestsIds: []string{joinRequestId},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetBody(confirmation).
			Post(tConfig.ServiceHost + "/api/events/" + eventId + "/confirmation")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusBadRequest, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("Confirm event by owner with invalid location", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		confirmation := api.EventConfirmationRequest{
			EventId:         eventId,
			LocationId:      "location3",
			Date:            "2023-10-15",
			Time:            14,
			Duration:        60,
			JoinRequestsIds: []string{joinRequestId},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetBody(confirmation).
			Post(tConfig.ServiceHost + "/api/events/" + eventId + "/confirmation")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusBadRequest, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("Confirm event by owner", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		confirmation := api.EventConfirmationRequest{
			EventId:         eventId,
			LocationId:      "matchpoint",
			Date:            "2023-10-15",
			Time:            14,
			Duration:        60,
			JoinRequestsIds: []string{joinRequestId},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetBody(confirmation).
			Post(tConfig.ServiceHost + "/api/events/" + eventId + "/confirmation")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("Get confirmed event", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		var response api.GetEventResponse
		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/events/" + eventId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))

			// Verify event is confirmed
			assert.Equal(tt, api.EventStatusConfirmed, response.Event.Status, "Event should be confirmed")
			assert.Equal(tt, "matchpoint", response.Event.Confirmation.LocationId, "Confirmed location should match")
			assert.Equal(tt, "2023-10-15", response.Event.Confirmation.Date.Format("2006-01-02"), "Confirmed date should match")
			assert.Equal(tt, 14, response.Event.Confirmation.Time, "Confirmed time should match")
			assert.Equal(tt, 60, response.Event.Confirmation.Duration, "Confirmed duration should match")
			assert.Len(tt, response.Event.Confirmation.AcceptedRequests, 1, "Should have one confirmed join request")
			assert.Equal(tt, joinRequestId, response.Event.Confirmation.AcceptedRequests[0].Id, "Confirmed join request ID should match")
		}
	})

	t.Run("DeleteEvent fails after confirmation", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		r, err := restClient.R().
			SetHeader("Authentication", user).
			Delete(tConfig.ServiceHost + "/api/events/" + eventId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusBadRequest, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}

	})

}

func Test_DeleteEvent(t *testing.T) {

	t.Run("CreateEvent", func(tt *testing.T) {
		user := "test-user-1"
		// Create an event
		eventData := api.CreateEventRequest{
			Event: api.EventData{
				Locations:       []string{"matchpoint", "spartan-pultuska"},
				SkillLevel:      api.SkillLevelIntermediate,
				EventType:       api.ActivityTypeMatch,
				ExpectedPlayers: 2,
				SessionDuration: 60,
				TimeSlots: []api.SessionTimeSlot{
					{Date: "2023-10-17", Time: 19},
				},
			},
		}

		var response api.CreateEventResponse

		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetBody(eventData).
			SetResult(&response).
			Post(tConfig.ServiceHost + "/api/events/")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusCreated, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}

		// delete event
		r, err = restClient.R().
			SetHeader("Authentication", user).
			Delete(tConfig.ServiceHost + "/api/events/" + response.Event.Id)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}

		r, err = restClient.R().
			SetHeader("Authentication", user).
			Get(tConfig.ServiceHost + "/api/events/" + response.Event.Id)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusNotFound, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}

	})
}

// Test Locations API
func Test_LocationsAPI(t *testing.T) {
	testUserId := "test-user-123"

	t.Run("ListLocations", func(tt *testing.T) {
		r, err := restClient.R().
			SetHeader("Authentication", testUserId).
			Get(tConfig.ServiceHost + "/api/locations/")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			assert.Contains(tt, string(r.Body()), `"locations":`)
		}
	})
}
