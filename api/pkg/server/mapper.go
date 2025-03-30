package server

import (
	"database/sql"
	"time"

	"github.com/xtp-tour/xtp-tour/api/pkg/db/model"
)

// DBToAPILocation converts a DB Facility model to an API Location model
func DBToAPILocation(facility *model.Facility) Location {
	location := Location{
		ID:      facility.ID,
		Name:    facility.Name,
		Address: facility.Address,
	}

	if facility.Location != (model.Point{}) {
		location.Coordinates = Coordinates{
			Latitude:  facility.Location.Lat,
			Longitude: facility.Location.Lng,
		}
	}

	return location
}

// APIToDBEvent converts an API Event model to a DB Event model
func APIToDBEvent(event *Event) *model.Event {
	dbEvent := &model.Event{
		ID:              event.Id,
		UserID:          event.UserId,
		Description:     sql.NullString{String: event.Description, Valid: event.Description != ""},
		ExpectedPlayers: event.ExpectedPlayers,
		SessionDuration: event.SessionDuration,
		CreatedAt:       event.CreatedAt,
		UpdatedAt:       time.Now().UTC(),
	}

	// Map skill level
	switch event.SkillLevel {
	case SkillLevelAny:
		dbEvent.SkillLevel = model.SkillLevelAny
	case SkillLevelBeginner:
		dbEvent.SkillLevel = model.SkillLevelBeginner
	case SkillLevelIntermediate:
		dbEvent.SkillLevel = model.SkillLevelIntermediate
	case SkillLevelAdvanced:
		dbEvent.SkillLevel = model.SkillLevelAdvanced
	}

	// Map event type
	switch event.EventType {
	case ActivityTypeMatch:
		dbEvent.EventType = model.EventTypeMatch
	case ActivityTypeTraining:
		dbEvent.EventType = model.EventTypeTraining
	}

	// Map status
	switch event.Status {
	case EventStatusOpen:
		dbEvent.Status = model.StatusOpen
	case EventStatusAccepted:
		dbEvent.Status = model.StatusAccepted
	case EventStatusConfirmed:
		dbEvent.Status = model.StatusConfirmed
	case EventStatusCancelled:
		dbEvent.Status = model.StatusCancelled
	case EventStatusReservationFailed:
		dbEvent.Status = model.StatusReservationFailed
	case EventStatusCompleted:
		dbEvent.Status = model.StatusCompleted
	}

	return dbEvent
}

// DBToAPIEvent converts a DB Event model to an API Event model
func DBToAPIEvent(dbEvent *model.Event) *Event {
	event := &Event{
		EventData: EventData{
			Id:              dbEvent.ID,
			Description:     dbEvent.Description.String,
			ExpectedPlayers: dbEvent.ExpectedPlayers,
			SessionDuration: dbEvent.SessionDuration,
		},
		UserId:    dbEvent.UserID,
		CreatedAt: dbEvent.CreatedAt,
	}

	// Map skill level
	switch dbEvent.SkillLevel {
	case model.SkillLevelAny:
		event.SkillLevel = SkillLevelAny
	case model.SkillLevelBeginner:
		event.SkillLevel = SkillLevelBeginner
	case model.SkillLevelIntermediate:
		event.SkillLevel = SkillLevelIntermediate
	case model.SkillLevelAdvanced:
		event.SkillLevel = SkillLevelAdvanced
	}

	// Map event type
	switch dbEvent.EventType {
	case model.EventTypeMatch:
		event.EventType = ActivityTypeMatch
	case model.EventTypeTraining:
		event.EventType = ActivityTypeTraining
	}

	// Map status
	switch dbEvent.Status {
	case model.StatusOpen:
		event.Status = EventStatusOpen
	case model.StatusAccepted:
		event.Status = EventStatusAccepted
	case model.StatusConfirmed:
		event.Status = EventStatusConfirmed
	case model.StatusCancelled:
		event.Status = EventStatusCancelled
	case model.StatusReservationFailed:
		event.Status = EventStatusReservationFailed
	case model.StatusCompleted:
		event.Status = EventStatusCompleted
	}

	return event
}

// APIToDBConfirmation converts an API Confirmation model to a DB Confirmation model
func APIToDBConfirmation(confirmation *Confirmation) *model.Confirmation {
	return &model.Confirmation{
		ID:         confirmation.EventId,
		EventID:    confirmation.EventId,
		LocationID: confirmation.LocationId,
		Date:       confirmation.Date,
		Time:       confirmation.Time,
		Duration:   confirmation.Duration,
		CreatedAt:  confirmation.CreatedAt,
	}
}

// DBToAPIConfirmation converts a DB Confirmation model to an API Confirmation model
func DBToAPIConfirmation(dbConfirmation *model.Confirmation) *Confirmation {
	return &Confirmation{
		EventId:    dbConfirmation.EventID,
		LocationId: dbConfirmation.LocationID,
		Date:       dbConfirmation.Date,
		Time:       dbConfirmation.Time,
		Duration:   dbConfirmation.Duration,
		CreatedAt:  dbConfirmation.CreatedAt,
	}
}

// APIToDBJoinRequest converts an API JoinRequest model to a DB JoinRequest model
func APIToDBJoinRequest(joinRequest *JoinRequest, eventId string) *model.JoinRequest {
	dbJoinRequest := &model.JoinRequest{
		ID:        joinRequest.Id,
		EventID:   eventId,
		UserID:    joinRequest.UserId,
		Comment:   sql.NullString{String: joinRequest.Comment, Valid: joinRequest.Comment != ""},
		CreatedAt: joinRequest.CreatedAt,
	}

	// Map status
	switch joinRequest.Status {
	case JoinRequestStatusWaiting:
		dbJoinRequest.Status = model.StatusOpen
	case JoinRequestStatusAccepted:
		dbJoinRequest.Status = model.StatusAccepted
	case JoinRequestStatusRejected:
		dbJoinRequest.Status = model.StatusCancelled
	case JoinRequestStatusCancelled:
		dbJoinRequest.Status = model.StatusCancelled
	case JoinRequestStatusReservationFailed:
		dbJoinRequest.Status = model.StatusReservationFailed
	}

	return dbJoinRequest
}

// DBToAPIJoinRequest converts a DB JoinRequest model to an API JoinRequest model
func DBToAPIJoinRequest(dbJoinRequest *model.JoinRequest) *JoinRequest {
	joinRequest := &JoinRequest{
		JoinRequestData: JoinRequestData{
			Id:      dbJoinRequest.ID,
			Comment: dbJoinRequest.Comment.String,
		},
		UserId:    dbJoinRequest.UserID,
		CreatedAt: dbJoinRequest.CreatedAt,
	}

	// Map status
	switch dbJoinRequest.Status {
	case model.StatusOpen:
		joinRequest.Status = JoinRequestStatusWaiting
	case model.StatusAccepted:
		joinRequest.Status = JoinRequestStatusAccepted
	case model.StatusCancelled:
		joinRequest.Status = JoinRequestStatusRejected
	case model.StatusReservationFailed:
		joinRequest.Status = JoinRequestStatusReservationFailed
	}

	return joinRequest
}

// APIToDBTimeSlot converts an API SessionTimeSlot to a DB TimeSlot
func APIToDBTimeSlot(timeSlot SessionTimeSlot) (*model.EventTimeSlot, error) {
	date, err := time.Parse("2006-01-02", timeSlot.Date)
	if err != nil {
		return nil, err
	}

	return &model.EventTimeSlot{
		Date: date,
		Time: timeSlot.Time,
	}, nil
}

// DBToAPITimeSlot converts a DB TimeSlot to an API SessionTimeSlot
func DBToAPITimeSlot(dbTimeSlot *model.EventTimeSlot) SessionTimeSlot {
	return SessionTimeSlot{
		Date: dbTimeSlot.Date.Format("2006-01-02"),
		Time: dbTimeSlot.Time,
	}
}
