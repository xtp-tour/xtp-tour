package notifications

import (
	"context"
	"fmt"
	"log/slog"
	"strings"

	"github.com/xtp-tour/xtp-tour/api/pkg/api"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

type NotifierDb interface {
	GetUsersNotificationSettings(eventId string) (map[string]db.EventNotifSettingsResult, error)
	GetUserNames(ctx context.Context, userIds []string) (map[string]string, error)
	GetFacilityName(ctx context.Context, facilityId string) (string, error)
	GetEventOwner(ctx context.Context, eventId string) (string, error)
}

const (
	TopicUserJoined = "user_joined"
)

type AllPurposeNotifier struct {
	db    NotifierDb
	queue Queue
}

func NewAllPurposeNotifier(db NotifierDb, queue Queue) *AllPurposeNotifier {
	return &AllPurposeNotifier{
		db:    db,
		queue: queue,
	}
}

func (d *AllPurposeNotifier) EventConfirmed(logCtx *slog.Logger, eventId string, joinRequestIds []string, dateTime string, locationId string, hostUserId string) {
	ctx := context.Background()

	// Get user notification settings
	notifPrefs, err := d.db.GetUsersNotificationSettings(eventId)
	if err != nil {
		logCtx.Error("Error getting notification settings for users", "error", err)
		return
	}

	// Get all user IDs (including host)
	allUserIds := []string{}
	for userId := range notifPrefs {
		allUserIds = append(allUserIds, userId)
	}

	// Get user names
	userNames, err := d.db.GetUserNames(ctx, allUserIds)
	if err != nil {
		logCtx.Error("Error getting user names", "error", err)
		return
	}

	// Get facility name
	facilityName, err := d.db.GetFacilityName(ctx, locationId)
	if err != nil {
		logCtx.Error("Error getting facility name", "error", err, "locationId", locationId)
		facilityName = "Unknown Location"
	}

	// Get host name
	hostName := ""
	confirmedUsers := []string{}
	for id, p := range notifPrefs {
		if p.IsHost == 1 {
			hostName = userNames[id]
		}
		if p.IsAccepted == 1 {
			confirmedUsers = append(confirmedUsers, userNames[id])
		}
	}

	if hostName == "" {
		logCtx.Error("No host found for event", "eventId", eventId)
		hostName = "Unknown Host"
	}

	for userId, prefs := range notifPrefs {
		msg := ""
		if prefs.IsHost == 1 {
			msg = fmt.Sprintf("Hello %s, you succefully confirmed the session on %s at %s. We notified %s about place and time of the event. Have a great time!", hostName,
				dateTime, facilityName, strings.Join(confirmedUsers, ", "))

		} else if prefs.IsAccepted == 1 {
			msg = fmt.Sprintf("Hello %s, your event join request has been confirmed by %s. The event will take place on %s at %s. Have a great time!",
				userNames[userId], hostName, dateTime, facilityName)
		}

		notificationData := db.NotificationQueueData{
			Topic:   "You have a training session scheduled",
			Message: msg,
		}

		err := d.queue.Enqueue(ctx, userId, notificationData)

		if err != nil {
			logCtx.Error("Failed to enqueue event confirmation notification",
				"error", err,
				"userId", userId,
				"topic", notificationData.Topic)
		}
	}
}

func (d *AllPurposeNotifier) UserJoined(logCtx slog.Logger, joinRequest api.JoinRequestData) {
	// Since we can't extract userId from slog directly, we'll skip this notification for now
	// TODO: Modify server interface to pass userId directly or implement proper context passing
	logCtx.Warn("UserJoined notification skipped - cannot determine joining user ID from current interface", "eventId", joinRequest.EventId)
}
