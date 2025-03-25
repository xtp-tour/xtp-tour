package server

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

// SessionTimeSlot represents an available time slot
type SessionTimeSlot struct {
	Date string `json:"date"`
	Time int    `json:"time"`
}

type JoinRequestData struct {
	Locations []string          `json:"locations" validate:"required"`
	TimeSlots []SessionTimeSlot `json:"timeSlots" validate:"required"`
	Comment   string            `json:"comment,omitempty"`
}

// JoinRequest represents a player's acceptance of an event
type JoinRequest struct {
	JoinRequestData
	UserId    string            `json:"userId"`
	Status    JoinRequestStatus `json:"status"`
	CreatedAt time.Time         `json:"createdAt"`
}

type EventConfirmationRequest struct {
	EventId         string   `path:"eventId" validate:"required"`
	LocationId      string   `json:"locationId" validate:"required"`
	Date            string   `json:"date" validate:"required"`
	Time            int      `json:"time" validate:"required"`
	Duration        int      `json:"duration" validate:"required"`
	JoinRequestsIds []string `json:"joinRequestsIds" validate:"required"`
}

type EventConfirmationResponse struct {
	Confirmation Confirmation `json:"confirmation"`
}

// Confirmation represents a confirmed court reservation
type Confirmation struct {
	EventId          string        `json:"eventId"`
	LocationId       string        `json:"location"`
	Date             string        `json:"date"`
	Time             int           `json:"time"`
	Duration         int           `json:"duration"`
	AcceptedRequests []JoinRequest `json:"acceptedRequests"`
	CreatedAt        time.Time     `json:"createdAt"`
}

// EventData represents user's input for an event
type EventData struct {
	Id              string            `json:"id"`
	Locations       []string          `json:"locations"`
	SkillLevel      SkillLevel        `json:"skillLevel"`
	Description     string            `json:"description,omitempty"`
	EventType       EventType         `json:"eventType"`
	ExpectedPlayers int               `json:"expectedPlayers"`
	SessionDuration int               `json:"sessionDuration"`
	TimeSlots       []SessionTimeSlot `json:"timeSlots"`
}

// Event represents an internal representation of an event
type Event struct {
	EventData
	UserId       string         `json:"userId"`
	Status       EventStatus    `json:"status"`
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
	Events []Event `json:"events"`
	Total  int     `json:"total"`
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

type GetLocationResponse struct {
	Location Location `json:"location"`
}

// end Locations

// Leftovers
type GetChallengesRequest struct {
	Id string `path:"id" validate:"required"`
}

type ListChallengesResponse struct {
	Challenges map[string]string `json:"challenges"`
}

type GetChallengesResponse struct {
	Result string
}

type ThingPutRequest struct {
	Name  string `path:"name" validate:"required"`
	Value string `json:"value" validate:"required"`
}

type ThingPutResponse struct {
}
