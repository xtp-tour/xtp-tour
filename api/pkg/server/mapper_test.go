package server

import (
	"database/sql"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/xtp-tour/xtp-tour/api/pkg/db/model"
)

func TestDBToAPILocation(t *testing.T) {
	tests := []struct {
		name     string
		facility *model.Facility
		want     Location
	}{
		{
			name: "basic location without coordinates",
			facility: &model.Facility{
				ID:      "facility1",
				Name:    "Tennis Club",
				Address: "123 Tennis St",
			},
			want: Location{
				ID:      "facility1",
				Name:    "Tennis Club",
				Address: "123 Tennis St",
			},
		},
		{
			name: "location with coordinates",
			facility: &model.Facility{
				ID:      "facility2",
				Name:    "Tennis Club 2",
				Address: "456 Tennis Ave",
				Location: model.Point{
					Lat: 45.123,
					Lng: -122.456,
				},
			},
			want: Location{
				ID:      "facility2",
				Name:    "Tennis Club 2",
				Address: "456 Tennis Ave",
				Coordinates: Coordinates{
					Latitude:  45.123,
					Longitude: -122.456,
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := DBToAPILocation(tt.facility)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestAPIToDBEvent(t *testing.T) {
	now := time.Now().UTC()
	tests := []struct {
		name  string
		event *Event
		want  *model.Event
	}{
		{
			name: "basic event",
			event: &Event{
				EventData: EventData{
					Id:              "event1",
					Description:     "Test event",
					SkillLevel:      SkillLevelIntermediate,
					EventType:       ActivityTypeMatch,
					ExpectedPlayers: 4,
					SessionDuration: 60,
				},
				UserId:    "user1",
				Status:    EventStatusOpen,
				CreatedAt: now,
			},
			want: &model.Event{
				ID:              "event1",
				UserID:          "user1",
				Description:     sql.NullString{String: "Test event", Valid: true},
				SkillLevel:      model.SkillLevelIntermediate,
				EventType:       model.EventTypeMatch,
				Status:          model.StatusOpen,
				ExpectedPlayers: 4,
				SessionDuration: 60,
				CreatedAt:       now,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := APIToDBEvent(tt.event)
			// Ignore UpdatedAt field in comparison as it's set to current time
			got.UpdatedAt = tt.want.UpdatedAt
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestDBToAPIEvent(t *testing.T) {
	now := time.Now().UTC()
	tests := []struct {
		name    string
		dbEvent *model.Event
		want    *Event
	}{
		{
			name: "basic event",
			dbEvent: &model.Event{
				ID:              "event1",
				UserID:          "user1",
				Description:     sql.NullString{String: "Test event", Valid: true},
				SkillLevel:      model.SkillLevelIntermediate,
				EventType:       model.EventTypeMatch,
				Status:          model.StatusOpen,
				ExpectedPlayers: 4,
				SessionDuration: 60,
				CreatedAt:       now,
			},
			want: &Event{
				EventData: EventData{
					Id:              "event1",
					Description:     "Test event",
					SkillLevel:      SkillLevelIntermediate,
					EventType:       ActivityTypeMatch,
					ExpectedPlayers: 4,
					SessionDuration: 60,
				},
				UserId:    "user1",
				Status:    EventStatusOpen,
				CreatedAt: now,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := DBToAPIEvent(tt.dbEvent)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestAPIToDBJoinRequest(t *testing.T) {
	now := time.Now().UTC()
	tests := []struct {
		name        string
		joinRequest *JoinRequest
		eventId     string
		want        *model.JoinRequest
	}{
		{
			name: "basic join request",
			joinRequest: &JoinRequest{
				JoinRequestData: JoinRequestData{
					Id:      "join1",
					Comment: "Test comment",
				},
				UserId:    "user1",
				Status:    JoinRequestStatusWaiting,
				CreatedAt: now,
			},
			eventId: "event1",
			want: &model.JoinRequest{
				ID:        "join1",
				EventID:   "event1",
				UserID:    "user1",
				Status:    model.StatusOpen,
				Comment:   sql.NullString{String: "Test comment", Valid: true},
				CreatedAt: now,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := APIToDBJoinRequest(tt.joinRequest, tt.eventId)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestDBToAPIJoinRequest(t *testing.T) {
	now := time.Now().UTC()
	tests := []struct {
		name          string
		dbJoinRequest *model.JoinRequest
		want          *JoinRequest
	}{
		{
			name: "basic join request",
			dbJoinRequest: &model.JoinRequest{
				ID:        "join1",
				EventID:   "event1",
				UserID:    "user1",
				Status:    model.StatusOpen,
				Comment:   sql.NullString{String: "Test comment", Valid: true},
				CreatedAt: now,
			},
			want: &JoinRequest{
				JoinRequestData: JoinRequestData{
					Id:      "join1",
					Comment: "Test comment",
				},
				UserId:    "user1",
				Status:    JoinRequestStatusWaiting,
				CreatedAt: now,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := DBToAPIJoinRequest(tt.dbJoinRequest)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestTimeSlotConversions(t *testing.T) {
	tests := []struct {
		name     string
		apiSlot  SessionTimeSlot
		wantDate time.Time
		wantErr  bool
	}{
		{
			name: "valid time slot",
			apiSlot: SessionTimeSlot{
				Date: "2024-03-30",
				Time: 14,
			},
			wantDate: time.Date(2024, 3, 30, 0, 0, 0, 0, time.UTC),
			wantErr:  false,
		},
		{
			name: "invalid date format",
			apiSlot: SessionTimeSlot{
				Date: "30-03-2024",
				Time: 14,
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := APIToDBTimeSlot(tt.apiSlot)
			if tt.wantErr {
				assert.Error(t, err)
				return
			}
			assert.NoError(t, err)
			assert.Equal(t, tt.wantDate, got.Date)
			assert.Equal(t, tt.apiSlot.Time, got.Time)

			// Test round trip conversion
			if !tt.wantErr {
				apiSlot := DBToAPITimeSlot(got)
				assert.Equal(t, tt.apiSlot.Date, apiSlot.Date)
				assert.Equal(t, tt.apiSlot.Time, apiSlot.Time)
			}
		})
	}
}
