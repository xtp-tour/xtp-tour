//go:build servicetest
// +build servicetest

package stest

import (
	"log/slog"
	"net/http"
	"testing"

	"github.com/go-resty/resty/v2"
	"github.com/num30/config"
	"github.com/stretchr/testify/assert"
	"github.com/xtp-tour/xtp-tour/api/pkg/server"
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
		eventData := server.CreateEventRequest{
			Event: server.EventData{
				Locations:       []string{"location1", "location2"},
				SkillLevel:      server.SkillLevelIntermediate,
				EventType:       server.ActivityTypeMatch,
				ExpectedPlayers: 2,
				SessionDuration: 60,
				TimeSlots: []server.SessionTimeSlot{
					{Date: "2023-10-15", Time: 14},
					{Date: "2023-10-16", Time: 16},
					{Date: "2023-10-17", Time: 18},
					{Date: "2023-10-17", Time: 19},
				},
				Description: "Test event for integration testing",
			},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetBody(eventData).
			Post(tConfig.ServiceHost + "/api/events/")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusCreated, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	// List events
	t.Run("ListEvents", func(tt *testing.T) {
		r, err := restClient.R().
			SetHeader("Authentication", user).
			Get(tConfig.ServiceHost + "/api/events/")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			assert.Contains(tt, string(r.Body()), `"events":`)
			assert.Contains(tt, string(r.Body()), `"description":"Test event for integration testing"`)
		}
	})

	// Get event by ID
	t.Run("GetEvent", func(tt *testing.T) {
		if eventId == "" {
			tt.Skip("Skipping test because event ID is not available")
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

	// Join an event
	t.Run("JoinEvent1", func(tt *testing.T) {
		if eventId == "" {
			tt.Skip("Skipping test because event ID is not available")
		}

		joinRequestData := server.JoinRequestRequest{
			JoinRequest: server.JoinRequestData{
				Locations: []string{"location1"},
				TimeSlots: []server.SessionTimeSlot{
					{Date: "2023-10-15", Time: 14},
					{Date: "2023-10-16", Time: 16},
				},
				Comment: "Hey, let's play"
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
			tt.Skip("Skipping test because event ID is not available")
		}

		joinRequestData := server.JoinRequestRequest{
			JoinRequest: server.JoinRequestData{
				Locations: []string{"location2", "location1"},
				TimeSlots: []server.SessionTimeSlot{
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
			tt.Skip("Skipping test because event ID is not available")
		}

		var response server.GetEventResponse
		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/events/" + eventId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
		assert.Equal(tt, response.Event.Id, eventId)
		assert.Equal(tt, response.Event.Status, server.EventStatusOpen)
		assert.Len(tt, response.Event.JoinRequests, 2)
	})

	t.Run("Confirm event by not owner",func(tt *testing.T) {
		if eventId == "" {
			tt.Skip("Skipping test because event ID is not available")
		}

		var response server.GetEventResponse
		confirmation := server.EventConfirmationRequest{
			EventId: eventId,
			LocationId: "location1",
			Date: "2023-10-15",
			Time: 14,
			Duration: 60,
			JoinRequestsIds: []string{response.Event.JoinRequests[0].Id},

		r, err := restClient.R().
			SetHeader("Authentication", user2).
			SetResult(&response).
			SetBody(confirmation).
			Get(tConfig.ServiceHost + "/api/events/" + eventId+"/confirmation")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusInvalidRequest, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
 	} )

	t.Run("Confirm event by owner with invalid time slot", func(tt *testing.T) {
		if eventId == "" {
			tt.Skip("Skipping test because event ID is not available")
		}

		confirmation := server.EventConfirmationRequest{
			EventId: eventId,
			LocationId: "location1",
			Date: "2023-05-15",
			Time: 14,
			Duration: 60,
			JoinRequestsIds: []string{response.Event.JoinRequests[0].Id},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetBody(confirmation).
			Post(tConfig.ServiceHost + "/api/events/" + eventId + "/confirmation")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusInvalidRequest, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("Confirm event by owner with invalid location", func(tt *testing.T) {
		if eventId == "" {
			tt.Skip("Skipping test because event ID is not available")
		}

		confirmation := server.EventConfirmationRequest{
			EventId: eventId,
			LocationId: "location3",
			Date: "2023-10-15",
			Time: 14,
			Duration: 60,
			JoinRequestsIds: []string{response.Event.JoinRequests[0].Id},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetBody(confirmation).
			Post(tConfig.ServiceHost + "/api/events/" + eventId + "/confirmation")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusInvalidRequest, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("Confirm event by owner", func(tt *testing.T) {
		if eventId == "" {
			tt.Skip("Skipping test because event ID is not available")
		}

		confirmation := server.EventConfirmationRequest{
			EventId: eventId,
			LocationId: "location1",
			Date: "2023-10-15",
			Time: 14,
			Duration: 60,
			JoinRequestsIds: []string{response.Event.JoinRequests[0].Id},
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
			tt.Skip("Skipping test because event ID is not available")
		}

		var response server.GetEventResponse
		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/events/" + eventId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}

		// Verify event is confirmed
		assert.Equal(tt, server.EventStatusConfirmed, response.Event.Status, "Event should be confirmed")
		assert.Equal(tt, "location1", response.Event.ConfirmedLocation, "Confirmed location should match")
		assert.Equal(tt, "2023-10-15", response.Event.ConfirmedDate, "Confirmed date should match")
		assert.Equal(tt, 14, response.Event.ConfirmedTime, "Confirmed time should match")
		assert.Equal(tt, 60, response.Event.ConfirmedDuration, "Confirmed duration should match")
		assert.Len(tt, response.Event.ConfirmedJoinRequestIds, 1, "Should have one confirmed join request")
		assert.Equal(tt, response.Event.JoinRequests[0].Id, response.Event.ConfirmedJoinRequestIds[0], "Confirmed join request ID should match")
	})

	// Delete an event
	t.Run("DeleteEvent", func(tt *testing.T) {
		if eventId == "" {
			tt.Skip("Skipping test because event ID is not available")
		}

		r, err := restClient.R().
			SetHeader("Authentication", user).
			Delete(tConfig.ServiceHost + "/api/events/" + eventId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}

		// Verify event is deleted
		r, err = restClient.R().
			SetHeader("Authentication", user).
			Get(tConfig.ServiceHost + "/api/events/" + eventId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusNotFound, r.StatusCode(), "Event should be deleted")
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
