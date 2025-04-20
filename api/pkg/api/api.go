package api

import "time"

// System
type HealthResponse struct {
	Status  string `json:"status"`
	Details string `json:"message"`
	Service string `json:"service"`
}

// Skill level constants
type SkillLevel string

const (
	SkillLevelAny          SkillLevel = "ANY"
	SkillLevelBeginner     SkillLevel = "BEGINNER"
	SkillLevelIntermediate SkillLevel = "INTERMEDIATE"
	SkillLevelAdvanced     SkillLevel = "ADVANCED"
)

// Activity type constants
type EventType string

const (
	ActivityTypeMatch    EventType = "MATCH"
	ActivityTypeTraining EventType = "TRAINING"
)

// Single/Double type constants
type SingleDoubleType string

const (
	SingleDoubleTypeSingle  SingleDoubleType = "SINGLE"
	SingleDoubleTypeDoubles SingleDoubleType = "DOUBLES"
	SingleDoubleTypeCustom  SingleDoubleType = "CUSTOM"
)

// Event status constants
type EventStatus string

const (
	EventStatusOpen              EventStatus = "OPEN"
	EventStatusAccepted          EventStatus = "ACCEPTED"
	EventStatusConfirmed         EventStatus = "CONFIRMED"
	EventStatusCancelled         EventStatus = "CANCELLED"
	EventStatusReservationFailed EventStatus = "RESERVATION_FAILED"
	EventStatusCompleted         EventStatus = "COMPLETED"
)

// Ack status constants
type JoinRequestStatus string

const (
	JoinRequestStatusWaiting           JoinRequestStatus = "WAITING"
	JoinRequestStatusAccepted          JoinRequestStatus = "ACCEPTED"
	JoinRequestStatusRejected          JoinRequestStatus = "REJECTED"
	JoinRequestStatusCancelled         JoinRequestStatus = "CANCELLED"
	JoinRequestStatusReservationFailed JoinRequestStatus = "RESERVATION_FAILED"
)

// Event visibility constants
type EventVisibility string

const (
	EventVisibilityPublic  EventVisibility = "PUBLIC"
	EventVisibilityPrivate EventVisibility = "PRIVATE"
)

type JoinRequestData struct {
	Id        string      `json:"id,omitempty"`
	Locations []string    `json:"locations" validate:"required,min=1"`
	TimeSlots []time.Time `json:"timeSlots" validate:"required,min=1"`
	Comment   string      `json:"comment,omitempty"`
}

// JoinRequest represents a player's acceptance of an event
type JoinRequest struct {
	JoinRequestData
	UserId    string            `json:"userId"`
	Status    JoinRequestStatus `json:"status" enum:"WAITING,ACCEPTED,REJECTED,CANCELLED,RESERVATION_FAILED"`
	CreatedAt time.Time         `json:"createdAt"`
}

type EventConfirmationRequest struct {
	EventId         string    `path:"eventId" validate:"required"`
	LocationId      string    `json:"locationId" validate:"required"`
	Datetime        time.Time `json:"datetime" validate:"required"`
	Duration        int       `json:"duration" validate:"required"`
	JoinRequestsIds []string  `json:"joinRequestsIds" validate:"required"`
}

type EventConfirmationResponse struct {
	Confirmation Confirmation `json:"confirmation"`
}

// Confirmation represents a confirmed court reservation
type Confirmation struct {
	EventId    string    `json:"eventId"`
	LocationId string    `json:"location"`
	Datetime   time.Time `json:"datetime"`
	Duration   int       `json:"duration"`
	CreatedAt  time.Time `json:"createdAt"`
}

// EventData represents user's input for an event
type EventData struct {
	Id              string          `json:"id"`
	UserId          string          `json:"userId" db:"user_id"`
	Locations       []string        `json:"locations" validate:"required,min=1" db:"locations"`
	SkillLevel      SkillLevel      `json:"skillLevel" validate:"required" db:"skill_level" enum:"ANY,BEGINNER,INTERMEDIATE,ADVANCED"`
	Description     string          `json:"description,omitempty" `
	EventType       EventType       `json:"eventType" validate:"required" db:"event_type" enum:"MATCH,TRAINING"`
	ExpectedPlayers int             `json:"expectedPlayers" validate:"required" db:"expected_players"`
	SessionDuration int             `json:"sessionDuration" validate:"required" db:"session_duration"`
	TimeSlots       []time.Time     `json:"timeSlots" validate:"required,min=1"`
	Visibility      EventVisibility `json:"visibility" validate:"required" enum:"PUBLIC,PRIVATE"`
}

// Event represents an internal representation of an event
type Event struct {
	EventData
	Status       EventStatus    `json:"status" enum:"OPEN,ACCEPTED,CONFIRMED,CANCELLED,RESERVATION_FAILED,COMPLETED"`
	CreatedAt    time.Time      `json:"createdAt"`
	JoinRequests []*JoinRequest `json:"joinRequests"`
	Confirmation *Confirmation  `json:"confirmation,omitempty"`
}

// API Request/Response types for events
type CreateEventRequest struct {
	Event EventData `json:"event" validate:"required"`
}

type CreateEventResponse struct {
	Event *Event `json:"event"`
}

type GetEventRequest struct {
	Id string `path:"id" validate:"required"`
}

type GetEventResponse struct {
	Event *Event `json:"event"`
}

type DeleteEventRequest struct {
	Id string `path:"id" validate:"required"`
}

type JoinRequestRequest struct {
	EventId     string          `path:"eventId" validate:"required"`
	JoinRequest JoinRequestData `json:"joinRequest" validate:"required"`
}

type JoinRequestResponse struct {
	JoinRequest JoinRequest `json:"joinRequest"`
}

type ListEventsRequest struct {
}

type ListEventsResponse struct {
	Events []*Event `json:"events"`
	Total  int      `json:"total"`
}

// Locations

type Coordinates struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type Location struct {
	ID          string      `json:"id"`
	Name        string      `json:"name"`
	Address     string      `json:"address,omitempty"`
	Coordinates Coordinates `json:"coordinates,omitempty"`
}

type ListLocationsRequest struct {
}

type ListLocationsResponse struct {
	Locations []Location `json:"locations"`
}

type GetLocationRequest struct {
	ID string `path:"id" validate:"required"`
}
