package server

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
type ActivityType string

const (
	ActivityTypeMatch    ActivityType = "MATCH"
	ActivityTypeTraining ActivityType = "TRAINING"
)

// Single/Double type constants
type SingleDoubleType string

const (
	SingleDoubleTypeSingle  SingleDoubleType = "SINGLE"
	SingleDoubleTypeDoubles SingleDoubleType = "DOUBLES"
	SingleDoubleTypeCustom  SingleDoubleType = "CUSTOM"
)

// Invitation status constants
type InvitationStatus string

const (
	InvitationStatusPending           InvitationStatus = "PENDING"
	InvitationStatusAccepted          InvitationStatus = "ACCEPTED"
	InvitationStatusConfirmed         InvitationStatus = "CONFIRMED"
	InvitationStatusCancelled         InvitationStatus = "CANCELLED"
	InvitationStatusReservationFailed InvitationStatus = "RESERVATION_FAILED"
	InvitationStatusCompleted         InvitationStatus = "COMPLETED"
)

// Ack status constants
type AckStatus string

const (
	AckStatusPending           AckStatus = "PENDING"
	AckStatusAccepted          AckStatus = "ACCEPTED"
	AckStatusRejected          AckStatus = "REJECTED"
	AckStatusCancelled         AckStatus = "CANCELLED"
	AckStatusReservationFailed AckStatus = "RESERVATION_FAILED"
)

// SessionTimeSlot represents an available time slot
type SessionTimeSlot struct {
	Date string `json:"date"`
	Time int    `json:"time"`
}

// Acks represents a player's acceptance of an invitation
type Acks struct {
	UserID    string            `json:"userId"`
	Locations []string          `json:"locations"`
	TimeSlots []SessionTimeSlot `json:"timeSlots"`
	Status    AckStatus         `json:"status"`
	Comment   string            `json:"comment,omitempty"`
	CreatedAt string            `json:"createdAt"`
}

// Reservation represents a confirmed court reservation
type Reservation struct {
	InvitationID string `json:"invitationId"`
	Location     string `json:"location"`
	Date         string `json:"date"`
	Time         int    `json:"time"`
	Duration     int    `json:"duration"`
	PlayerBID    string `json:"playerBId"`
	CreatedAt    string `json:"createdAt"`
}

// Invitation represents a tennis invitation
type Invitation struct {
	ID              string            `json:"id"`
	OwnerID         string            `json:"ownerId"`
	Locations       []string          `json:"locations"`
	SkillLevel      SkillLevel        `json:"skillLevel"`
	InvitationType  ActivityType      `json:"invitationType"`
	ExpectedPlayers int               `json:"expectedPlayers"`
	SessionDuration int               `json:"sessionDuration"`
	TimeSlots       []SessionTimeSlot `json:"timeSlots"`
	Description     string            `json:"description,omitempty"`
	Status          InvitationStatus  `json:"status"`
	CreatedAt       string            `json:"createdAt"`
	Acks            []Acks            `json:"acks"`
	Reservation     *Reservation      `json:"reservation,omitempty"`
}

// API Request/Response types for invitations
type CreateInvitationRequest struct {
	Invitation Invitation `json:"invitation" validate:"required"`
}

type CreateInvitationResponse struct {
	ID string `json:"id"`
}

type GetInvitationRequest struct {
	ID string `path:"id" validate:"required"`
}

type GetInvitationResponse struct {
	Invitation Invitation `json:"invitation"`
}

type ListInvitationsRequest struct {
	Status  string `query:"status,omitempty"`
	OwnerID string `query:"ownerId,omitempty"`
}

type ListInvitationsResponse struct {
	Invitations []Invitation `json:"invitations"`
	Total       int          `json:"total"`
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
