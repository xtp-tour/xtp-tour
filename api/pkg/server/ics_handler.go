package server

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/xtp-tour/xtp-tour/api/pkg/api"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

func (r *Router) getEventCalendarHandler(c *gin.Context) {
	eventId := c.Param("eventId")
	if eventId == "" {
		c.JSON(http.StatusBadRequest, api.ErrorMessage{Message: "Event ID is required"})
		return
	}

	logCtx := slog.With("eventId", eventId)

	event, err := r.db.GetEventById(context.Background(), eventId)
	if err != nil {
		logCtx.Error("Failed to get event for ICS", "error", err)
		c.JSON(http.StatusInternalServerError, api.ErrorMessage{Message: "Failed to get event"})
		return
	}

	if event == nil {
		c.JSON(http.StatusNotFound, api.ErrorMessage{Message: "Event not found"})
		return
	}

	if event.Status != api.EventStatusConfirmed {
		c.JSON(http.StatusBadRequest, api.ErrorMessage{Message: "Event is not confirmed"})
		return
	}

	facilityName, err := r.db.GetFacilityName(context.Background(), event.Confirmation.LocationId)
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			facilityName = event.Confirmation.LocationId
		} else {
			logCtx.Error("Failed to get facility name", "error", err)
			c.JSON(http.StatusInternalServerError, api.ErrorMessage{Message: "Failed to get location"})
			return
		}
	}

	ics, err := generateICS(event, facilityName)
	if err != nil {
		logCtx.Error("Failed to generate ICS", "error", err)
		c.JSON(http.StatusInternalServerError, api.ErrorMessage{Message: "Failed to generate calendar file"})
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"event-%s.ics\"", eventId))
	c.Data(http.StatusOK, "text/calendar; charset=utf-8", []byte(ics))
}

func generateICS(event *api.Event, facilityName string) (string, error) {
	dtStart, err := time.Parse(time.RFC3339, event.Confirmation.Datetime)
	if err != nil {
		return "", fmt.Errorf("invalid event datetime: %w", err)
	}

	dtEnd := dtStart.Add(time.Duration(event.SessionDuration) * time.Minute)

	now := time.Now().UTC()
	dtstamp := now.Format("20060102T150405Z")
	dtStartStr := dtStart.UTC().Format("20060102T150405Z")
	dtEndStr := dtEnd.UTC().Format("20060102T150405Z")

	eventTypeLabel := "Match"
	if event.EventType == api.ActivityTypeTraining {
		eventTypeLabel = "Training"
	}

	summary := fmt.Sprintf("Tennis %s at %s", eventTypeLabel, facilityName)

	description := event.Description
	if description == "" {
		description = summary
	}

	ics := "BEGIN:VCALENDAR\r\n" +
		"VERSION:2.0\r\n" +
		"PRODID:-//XTP Tour//XTP Tour//EN\r\n" +
		"BEGIN:VEVENT\r\n" +
		fmt.Sprintf("UID:%s@xtptour.com\r\n", event.Id) +
		fmt.Sprintf("DTSTAMP:%s\r\n", dtstamp) +
		fmt.Sprintf("DTSTART:%s\r\n", dtStartStr) +
		fmt.Sprintf("DTEND:%s\r\n", dtEndStr) +
		fmt.Sprintf("SUMMARY:%s\r\n", summary) +
		fmt.Sprintf("LOCATION:%s\r\n", facilityName) +
		fmt.Sprintf("DESCRIPTION:%s\r\n", description) +
		"END:VEVENT\r\n" +
		"END:VCALENDAR\r\n"

	return ics, nil
}
