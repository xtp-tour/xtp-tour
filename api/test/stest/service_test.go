//go:build servicetest
// +build servicetest

package stest

import (
	"fmt"
	"log/slog"
	"net/http"
	"slices"
	"testing"
	"time"

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

// Helper functions for generating relative dates
func getRelativeDate(days int, hour int) string {
	t := time.Now().AddDate(0, 0, days)
	t = time.Date(t.Year(), t.Month(), t.Day(), hour, 0, 0, 0, time.UTC)
	return t.Format(time.RFC3339)
}

func getRelativeTimeSlots() []string {
	return []string{
		getRelativeDate(2, 14), // 2 days from now at 14:00
		getRelativeDate(3, 16), // 3 days from now at 16:00
		getRelativeDate(3, 18), // 3 days from now at 18:00
		getRelativeDate(4, 18), // 4 days from now at 18:00
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
	timeSlots := getRelativeTimeSlots()
	confirmedDate := timeSlots[3] // Using the last time slot as confirmed date
	confirmedLocation := "matchpoint"
	var joinRequestIdToConfirm string
	var eventId string

	// Create an event
	t.Run("CreateEvent", func(tt *testing.T) {
		eventData := api.CreateEventRequest{
			Event: api.EventData{
				Locations:       []string{confirmedLocation, "spartan-pultuska"},
				SkillLevel:      api.SkillLevelIntermediate,
				EventType:       api.ActivityTypeMatch,
				ExpectedPlayers: 2,
				SessionDuration: 60,
				TimeSlots:       timeSlots,
				Description:     "Test event for integration testing",
				Visibility:      api.EventVisibilityPublic,
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

	t.Logf("Event ID: %s", eventId)
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

	t.Run("GetEventFailsForNonOwner", func(tt *testing.T) {
		r, err := restClient.R().
			SetHeader("Authentication", user2).
			Get(tConfig.ServiceHost + "/api/events/" + eventId)
		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusNotFound, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("GetPublicEvent", func(tt *testing.T) {
		r, err := restClient.R().
			SetHeader("Authentication", user2).
			Get(tConfig.ServiceHost + "/api/events/public/" + eventId)
		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	// Join an event
	t.Run("JoinEvent1", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		joinRequestData := api.JoinRequestRequest{
			JoinRequest: api.JoinRequestData{
				Locations: []string{"matchpoint"},
				TimeSlots: []string{
					timeSlots[0],
					timeSlots[1],
					confirmedDate,
				},
				Comment: "Hey, let's play",
			},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user2).
			SetBody(joinRequestData).
			Post(tConfig.ServiceHost + "/api/events/public/" + eventId + "/joins")

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
				TimeSlots: []string{
					timeSlots[0],
					timeSlots[1],
					getRelativeDate(4, 19), // One hour after confirmed date
					confirmedDate,
				},
				Comment: "Let's play tennis!",
			},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user3).
			SetBody(joinRequestData).
			Post(tConfig.ServiceHost + "/api/events/public/" + eventId + "/joins")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("ListEventsThatUserJoined", func(tt *testing.T) {
		var response api.ListEventsResponse
		r, err := restClient.R().
			SetHeader("Authentication", user2).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/events/public?joined=true")
		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			assert.Greater(tt, len(response.Events), 0, "No events found")
			c := slices.ContainsFunc(response.Events, func(e *api.Event) bool {
				return e.Id == eventId
			})
			assert.True(tt, c, "Event ID should exist in the list of events")
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
			joinRequestIdToConfirm = response.Event.JoinRequests[0].Id
		}
	})

	t.Run("Confirm event by not owner", func(tt *testing.T) {
		if eventId == "" || joinRequestIdToConfirm == "" {
			assert.Fail(tt, fmt.Sprintf("Event ID or join request ID is not available. Event ID: %s, join request ID: %s", eventId, joinRequestIdToConfirm))
		}

		confirmation := api.EventConfirmationRequest{
			EventId:         eventId,
			LocationId:      "matchpoint",
			DateTime:        api.DtToIso(api.ParseDt(getRelativeDate(-30, 14))), // 30 days in the past
			JoinRequestsIds: []string{joinRequestIdToConfirm},
		}

		r, err := restClient.R().
			SetHeader("Authentication", user2).
			SetBody(confirmation).
			Post(tConfig.ServiceHost + "/api/events/" + eventId + "/confirmation")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusNotFound, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	t.Run("Confirm event by owner with invalid time slot", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
		}

		confirmation := api.EventConfirmationRequest{
			EventId:         eventId,
			LocationId:      "matchpoint",
			DateTime:        api.DtToIso(api.ParseDt(getRelativeDate(-30, 14))), // 30 days in the past
			JoinRequestsIds: []string{joinRequestIdToConfirm},
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
		confirmation := api.EventConfirmationRequest{
			EventId:         eventId,
			LocationId:      "location3",
			DateTime:        timeSlots[0],
			JoinRequestsIds: []string{joinRequestIdToConfirm},
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
		confirmation := api.EventConfirmationRequest{
			EventId:         eventId,
			LocationId:      confirmedLocation,
			DateTime:        confirmedDate,
			JoinRequestsIds: []string{joinRequestIdToConfirm},
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
			assert.Equal(tt, confirmedLocation, response.Event.Confirmation.LocationId, "Confirmed location should match")
			assert.Equal(tt, confirmedDate, response.Event.Confirmation.Datetime, "Confirmed date should match")

			haveAcceptedReq := false
			for _, r := range response.Event.JoinRequests {
				if r.IsAccepted != nil && *r.IsAccepted {
					haveAcceptedReq = true
					break
				}
			}
			assert.True(tt, haveAcceptedReq, "Accepted join request was not found")
		}
	})

	t.Run("List public events", func(tt *testing.T) {
		var response api.ListEventsResponse
		r, err := restClient.R().
			SetHeader("Authentication", user).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/events/public")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			found := slices.ContainsFunc(response.Events, func(e *api.Event) bool {
				return e.Id == eventId
			})
			assert.False(tt, found, "Confirmed event should not be in the list of public events")
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
				TimeSlots: []string{
					getRelativeDate(4, 19), // 4 days from now at 19:00
				},
				Visibility: api.EventVisibilityPublic,
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

// Test Profile API endpoints
func Test_ProfileAPI(t *testing.T) {
	timestamp := time.Now().UnixNano()
	testUser := fmt.Sprintf("test-%d", timestamp%1000000) // Keep it short for VARCHAR(36)
	anotherUser := fmt.Sprintf("user-%d", timestamp%1000000)

	// Test getting profile when it doesn't exist
	t.Run("GetNonExistentProfile", func(tt *testing.T) {
		r, err := restClient.R().
			SetHeader("Authentication", testUser).
			Get(tConfig.ServiceHost + "/api/profiles/me")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusNotFound, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	// Create a profile
	t.Run("CreateProfile", func(tt *testing.T) {
		profileData := api.CreateUserProfileRequest{

			FirstName:     "John",
			LastName:      "Doe",
			NTRPLevel:     4.5,
			PreferredCity: "Warsaw",
		}

		var response api.CreateUserProfileResponse
		r, err := restClient.R().
			SetHeader("Authentication", testUser).
			SetBody(profileData).
			SetResult(&response).
			Post(tConfig.ServiceHost + "/api/profiles/")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			if assert.NotNil(tt, response.Profile) {
				assert.Equal(tt, testUser, response.Profile.UserId)
				assert.Equal(tt, "John", response.Profile.FirstName)
				assert.Equal(tt, "Doe", response.Profile.LastName)
				assert.Equal(tt, 4.5, response.Profile.NTRPLevel)
				assert.Equal(tt, "Warsaw", response.Profile.PreferredCity)
			}
		}
	})

	// Get own profile
	t.Run("GetOwnProfile", func(tt *testing.T) {
		var response api.GetUserProfileResponse
		r, err := restClient.R().
			SetHeader("Authentication", testUser).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/profiles/me")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			if assert.NotNil(tt, response.Profile) {
				assert.Equal(tt, testUser, response.Profile.UserId)
				assert.Equal(tt, "John", response.Profile.FirstName)
				assert.Equal(tt, "Doe", response.Profile.LastName)
				assert.Equal(tt, 4.5, response.Profile.NTRPLevel)
				assert.Equal(tt, "Warsaw", response.Profile.PreferredCity)
			}
		}
	})

	// Update profile
	t.Run("UpdateProfile", func(tt *testing.T) {
		profileData := api.UpdateUserProfileRequest{
			UserProfileData: api.UserProfileData{
				FirstName:     "Jane",
				LastName:      "Smith",
				NTRPLevel:     3.5,
				PreferredCity: "Krakow",
			},
		}

		var response api.UpdateUserProfileResponse
		r, err := restClient.R().
			SetHeader("Authentication", testUser).
			SetBody(profileData).
			SetResult(&response).
			Put(tConfig.ServiceHost + "/api/profiles/me")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			if assert.NotNil(tt, response.Profile) {
				assert.Equal(tt, testUser, response.Profile.UserId)
				assert.Equal(tt, "Jane", response.Profile.FirstName)
				assert.Equal(tt, "Smith", response.Profile.LastName)
				assert.Equal(tt, 3.5, response.Profile.NTRPLevel)
				assert.Equal(tt, "Krakow", response.Profile.PreferredCity)
			}
		}
	})

	// Verify profile was updated
	t.Run("GetUpdatedProfile", func(tt *testing.T) {
		var response api.GetUserProfileResponse
		r, err := restClient.R().
			SetHeader("Authentication", testUser).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/profiles/me")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			if assert.NotNil(tt, response.Profile) {
				assert.Equal(tt, testUser, response.Profile.UserId)
				assert.Equal(tt, "Jane", response.Profile.FirstName)
				assert.Equal(tt, "Smith", response.Profile.LastName)
				assert.Equal(tt, 3.5, response.Profile.NTRPLevel)
				assert.Equal(tt, "Krakow", response.Profile.PreferredCity)
			}
		}
	})

	// Create another user's profile for testing profile lookup
	t.Run("CreateAnotherUserProfile", func(tt *testing.T) {
		profileData := api.CreateUserProfileRequest{

			FirstName:     "Bob",
			LastName:      "Johnson",
			NTRPLevel:     5.0,
			PreferredCity: "Gdansk",
		}

		var response api.CreateUserProfileResponse
		r, err := restClient.R().
			SetHeader("Authentication", anotherUser).
			SetBody(profileData).
			SetResult(&response).
			Post(tConfig.ServiceHost + "/api/profiles/")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			if assert.NotNil(tt, response.Profile) {
				assert.Equal(tt, anotherUser, response.Profile.UserId)
				assert.Equal(tt, "Bob", response.Profile.FirstName)
			}
		}
	})

	// Get another user's profile by user ID
	t.Run("GetOtherUserProfile", func(tt *testing.T) {
		var response api.GetUserProfileResponse
		r, err := restClient.R().
			SetHeader("Authentication", testUser).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/profiles/" + anotherUser)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			if assert.NotNil(tt, response.Profile) {
				assert.Equal(tt, anotherUser, response.Profile.UserId)
				assert.Equal(tt, "Bob", response.Profile.FirstName)
				assert.Equal(tt, "Johnson", response.Profile.LastName)
				assert.Equal(tt, 5.0, response.Profile.NTRPLevel)
				assert.Equal(tt, "Gdansk", response.Profile.PreferredCity)
			}
		}
	})

	// Test getting profile of non-existent user
	t.Run("GetNonExistentUserProfile", func(tt *testing.T) {
		r, err := restClient.R().
			SetHeader("Authentication", testUser).
			Get(tConfig.ServiceHost + "/api/profiles/non-existent-user")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusNotFound, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	// Test updating profile with invalid NTRP level
	t.Run("UpdateProfileInvalidNTRP", func(tt *testing.T) {
		profileData := api.UpdateUserProfileRequest{
			UserProfileData: api.UserProfileData{
				FirstName:     "Invalid",
				LastName:      "NTRP",
				NTRPLevel:     10.0, // Invalid - NTRP should be 1.0-7.0
				PreferredCity: "Test City",
			},
		}

		r, err := restClient.R().
			SetHeader("Authentication", testUser).
			SetBody(profileData).
			Put(tConfig.ServiceHost + "/api/profiles/me")

		if assert.NoError(tt, err) {
			// Database constraint should reject invalid NTRP level (10.0 is outside 1.0-7.0 range)
			assert.Equal(tt, http.StatusInternalServerError, r.StatusCode(),
				"Invalid NTRP level should result in database constraint error. Response body: %s", string(r.Body()))
		}
	})

	// Test updating profile of non-existent user
	t.Run("UpdateNonExistentUserProfile", func(tt *testing.T) {
		profileData := api.UpdateUserProfileRequest{
			UserProfileData: api.UserProfileData{
				FirstName:     "Non",
				LastName:      "Existent",
				NTRPLevel:     3.0,
				PreferredCity: "No City",
			},
		}

		r, err := restClient.R().
			SetHeader("Authentication", "non-existent-user-123").
			SetBody(profileData).
			Put(tConfig.ServiceHost + "/api/profiles/me")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusNotFound, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	// Test creating profile with minimal data (within valid constraints)
	t.Run("CreateProfileMinimalData", func(tt *testing.T) {
		testUserMinimal := fmt.Sprintf("min-%d", timestamp%1000000)
		profileData := api.CreateUserProfileRequest{

			FirstName:     "",
			LastName:      "",
			NTRPLevel:     1.0, // Minimum valid NTRP level
			PreferredCity: "",
		}

		var response api.CreateUserProfileResponse
		r, err := restClient.R().
			SetHeader("Authentication", testUserMinimal).
			SetBody(profileData).
			SetResult(&response).
			Post(tConfig.ServiceHost + "/api/profiles/")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			if assert.NotNil(tt, response.Profile) {
				assert.Equal(tt, testUserMinimal, response.Profile.UserId)
			}
		}
	})
}

func Test_CancelJoinRequest(t *testing.T) {
	usrOwner := "join-event-owner"
	usrJoiner := "join-event-joiner"
	timeSlots := getRelativeTimeSlots()
	var eventId string
	var joinRequestId string

	// Create an event
	t.Run("CreateEvent", func(tt *testing.T) {
		eventData := api.CreateEventRequest{
			Event: api.EventData{
				Locations:       []string{"matchpoint"},
				SkillLevel:      api.SkillLevelIntermediate,
				EventType:       api.ActivityTypeMatch,
				ExpectedPlayers: 2,
				SessionDuration: 60,
				TimeSlots:       timeSlots,
				Description:     "Test event for join request cancellation",
				Visibility:      api.EventVisibilityPublic,
			},
		}

		var response api.CreateEventResponse

		r, err := restClient.R().
			SetHeader("Authentication", usrOwner).
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

	// Join the event
	t.Run("JoinEvent", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
			return
		}

		joinRequestData := api.JoinRequestRequest{
			JoinRequest: api.JoinRequestData{
				Locations: []string{"matchpoint"},
				TimeSlots: []string{timeSlots[0]},
				Comment:   "I want to join",
			},
		}

		var response api.JoinRequestResponse
		r, err := restClient.R().
			SetHeader("Authentication", usrJoiner).
			SetBody(joinRequestData).
			SetResult(&response).
			Post(tConfig.ServiceHost + "/api/events/public/" + eventId + "/joins")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			if assert.NotNil(tt, response.JoinRequest) {
				joinRequestId = response.JoinRequest.Id
				t.Logf("Created join request with ID: %s", joinRequestId)
			}
		}
	})

	// Try to cancel non-existent join request
	t.Run("CancelNonExistentJoinRequest", func(tt *testing.T) {
		r, err := restClient.R().
			SetHeader("Authentication", usrJoiner).
			Delete(tConfig.ServiceHost + "/api/events/public/" + eventId + "/joins/non-existent-id")

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusNotFound, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	// Try to cancel another user's join request
	t.Run("CancelAnotherUsersJoinRequest", func(tt *testing.T) {
		if joinRequestId == "" {
			assert.Fail(tt, "Join request ID is not available")
			return
		}

		r, err := restClient.R().
			SetHeader("Authentication", usrOwner).
			Delete(tConfig.ServiceHost + "/api/events/public/" + eventId + "/joins/" + joinRequestId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusNotFound, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	// Cancel own join request
	t.Run("CancelOwnJoinRequest", func(tt *testing.T) {
		if joinRequestId == "" {
			assert.Fail(tt, "Join request ID is not available")
			return
		}

		r, err := restClient.R().
			SetHeader("Authentication", usrJoiner).
			Delete(tConfig.ServiceHost + "/api/events/public/" + eventId + "/joins/" + joinRequestId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
		}
	})

	// Verify join request is deleted
	t.Run("VerifyJoinRequestDeleted", func(tt *testing.T) {
		if eventId == "" {
			assert.Fail(tt, "Event ID is not available")
			return
		}

		var response api.GetEventResponse
		r, err := restClient.R().
			SetHeader("Authentication", usrOwner).
			SetResult(&response).
			Get(tConfig.ServiceHost + "/api/events/" + eventId)

		if assert.NoError(tt, err) {
			assert.Equal(tt, http.StatusOK, r.StatusCode(), "Invalid status code. Response body: %s", string(r.Body()))
			assert.Equal(tt, 0, len(response.Event.JoinRequests), "Join request should be deleted")
		}
	})
}
