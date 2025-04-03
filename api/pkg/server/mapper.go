package server

import (
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/aarondl/opt/null"
	"github.com/xtp-tour/xtp-tour/api/pkg/db/models"
)

// DBToAPILocation converts a DB Facility model to an API Location model
func DBToAPILocation(facility *models.Facility) Location {
	// Parse coordinates from the location string
	var coordinates Coordinates
	if facility.Location != "" {
		// Parse the location string which is in the format "latitude,longitude"
		parts := strings.Split(facility.Location, ",")
		if len(parts) == 2 {
			if lat, err := strconv.ParseFloat(parts[0], 64); err == nil {
				coordinates.Latitude = lat
			}
			if lng, err := strconv.ParseFloat(parts[1], 64); err == nil {
				coordinates.Longitude = lng
			}
		}
	}

	return Location{
		ID:          facility.ID,
		Name:        facility.Name,
		Address:     facility.Address,
		Coordinates: coordinates,
	}
}

// APIToDBFacility converts an API Location model to a DB Facility model
func APIToDBFacility(location *Location) *models.Facility {
	// Format location string as "latitude,longitude"
	locationStr := ""
	if location.Coordinates.Latitude != 0 || location.Coordinates.Longitude != 0 {
		locationStr = fmt.Sprintf("%f,%f", location.Coordinates.Latitude, location.Coordinates.Longitude)
	}

	facility := &models.Facility{
		ID:       location.ID,
		Name:     location.Name,
		Address:  location.Address,
		Location: locationStr,
		// Default country if not provided
		Country: "US",
	}

	return facility
}

// DBToAPIFacility converts a DB Facility model to an API Location model
func DBToAPIFacility(facility *models.Facility) Location {
	// Parse coordinates from the location string
	var coordinates Coordinates
	if facility.Location != "" {
		// Parse the location string which is in the format "latitude,longitude"
		parts := strings.Split(facility.Location, ",")
		if len(parts) == 2 {
			if lat, err := strconv.ParseFloat(parts[0], 64); err == nil {
				coordinates.Latitude = lat
			}
			if lng, err := strconv.ParseFloat(parts[1], 64); err == nil {
				coordinates.Longitude = lng
			}
		}
	}

	return Location{
		ID:          facility.ID,
		Name:        facility.Name,
		Address:     facility.Address,
		Coordinates: coordinates,
	}
}

// APIToDBEvent converts an API Event model to a DB Event model
func APIToDBEvent(event *Event) *models.Event {
	var description null.Val[string]
	if event.Description != "" {
		description.Set(event.Description)
	}

	dbEvent := &models.Event{
		ID:              event.Id,
		UserID:          event.UserId,
		SkillLevel:      models.EventsSkillLevel(event.SkillLevel),
		Description:     description,
		EventType:       models.EventsEventType(event.EventType),
		ExpectedPlayers: int32(event.ExpectedPlayers),
		SessionDuration: int32(event.SessionDuration),
		Status:          models.EventsStatus(event.Status),
		CreatedAt:       event.CreatedAt,
		UpdatedAt:       time.Now(),
	}

	return dbEvent
}

// DBToAPIEvent converts a DB Event model to an API Event model
func DBToAPIEvent(dbEvent *models.Event) *Event {
	var description string
	if dbEvent.Description.IsSet() {
		description = dbEvent.Description.MustGet()
	}

	event := &Event{
		EventData: EventData{
			Id:              dbEvent.ID,
			SkillLevel:      SkillLevel(dbEvent.SkillLevel),
			Description:     description,
			EventType:       EventType(dbEvent.EventType),
			ExpectedPlayers: int(dbEvent.ExpectedPlayers),
			SessionDuration: int(dbEvent.SessionDuration),
		},
		UserId:    dbEvent.UserID,
		Status:    EventStatus(dbEvent.Status),
		CreatedAt: dbEvent.CreatedAt,
	}

	return event
}

// APIToDBJoinRequest converts an API JoinRequest model to a DB JoinRequest model
func APIToDBJoinRequest(joinRequest *JoinRequest, eventId string) *models.JoinRequest {
	var comment null.Val[string]
	if joinRequest.Comment != "" {
		comment.Set(joinRequest.Comment)
	}

	dbJoinRequest := &models.JoinRequest{
		ID:        joinRequest.Id,
		EventID:   eventId,
		UserID:    joinRequest.UserId,
		Status:    models.JoinRequestsStatus(joinRequest.Status),
		Comment:   comment,
		CreatedAt: joinRequest.CreatedAt,
	}

	return dbJoinRequest
}

// DBToAPIJoinRequest converts a DB JoinRequest model to an API JoinRequest model
func DBToAPIJoinRequest(dbJoinRequest *models.JoinRequest) *JoinRequest {
	var comment string
	if dbJoinRequest.Comment.IsSet() {
		comment = dbJoinRequest.Comment.MustGet()
	}

	joinRequest := &JoinRequest{
		JoinRequestData: JoinRequestData{
			Id:      dbJoinRequest.ID,
			Comment: comment,
		},
		UserId:    dbJoinRequest.UserID,
		Status:    JoinRequestStatus(dbJoinRequest.Status),
		CreatedAt: dbJoinRequest.CreatedAt,
	}

	return joinRequest
}

// APIToDBConfirmation converts an API Confirmation model to a DB Confirmation model
func APIToDBConfirmation(confirmation *Confirmation) *models.Confirmation {
	dbConfirmation := &models.Confirmation{
		ID:         confirmation.EventId, // Using EventId as the ID for simplicity
		EventID:    confirmation.EventId,
		LocationID: confirmation.LocationId,
		Date:       confirmation.Date,
		Time:       int32(confirmation.Time),
		Duration:   int32(confirmation.Duration),
		CreatedAt:  confirmation.CreatedAt,
	}

	return dbConfirmation
}

// DBToAPIConfirmation converts a DB Confirmation model to an API Confirmation model
func DBToAPIConfirmation(dbConfirmation *models.Confirmation) *Confirmation {
	confirmation := &Confirmation{
		EventId:    dbConfirmation.EventID,
		LocationId: dbConfirmation.LocationID,
		Date:       dbConfirmation.Date,
		Time:       int(dbConfirmation.Time),
		Duration:   int(dbConfirmation.Duration),
		CreatedAt:  dbConfirmation.CreatedAt,
	}

	return confirmation
}
