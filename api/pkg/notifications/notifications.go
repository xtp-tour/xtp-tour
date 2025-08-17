package notifications

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/xtp-tour/xtp-tour/api/pkg/api"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

type NotifierDb interface {
	GetUserNotificationSettings(joinRequestIds []string) (map[string]db.NotificationSettings, error)
	GetUserNames(ctx context.Context, userIds []string) (map[string]string, error)
	GetFacilityName(ctx context.Context, facilityId string) (string, error)
	GetEventOwner(ctx context.Context, eventId string) (string, error)
}

const (
	TopicEventConfirmed = "event_confirmed"
	TopicUserJoined     = "user_joined"
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

func (d *AllPurposeNotifier) EventConfirmed(logCtx *slog.Logger, joinRequestIds []string, dateTime string, locationId string, hostUserId string) {
	ctx := context.Background()

	// Get user notification settings
	userNotifPrefs, err := d.db.GetUserNotificationSettings(joinRequestIds)
	if err != nil {
		logCtx.Error("Error getting notification settings for users", "error", err)
		return
	}

	// Get all user IDs (including host)
	allUserIds := make([]string, 0, len(joinRequestIds)+1)
	allUserIds = append(allUserIds, joinRequestIds...)
	allUserIds = append(allUserIds, hostUserId)

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

	hostName := userNames[hostUserId]
	if hostName == "" {
		hostName = "Unknown Host"
	}

	// Queue notification messages
	for _, userId := range joinRequestIds {
		_, exists := userNotifPrefs[userId]
		if !exists {
			logCtx.Error("No notification preferences found for user", "userId", userId)
			continue
		}

		userName := userNames[userId]
		if userName == "" {
			userName = "Unknown User"
		}

		msg := fmt.Sprintf("Hello %s, your event join request has been confirmed by %s. The event will take place on %s at %s.",
			userName, hostName, dateTime, facilityName)

		notificationData := db.NotificationQueueData{
			Topic:   TopicEventConfirmed,
			Message: msg,
		}

		if err := d.queue.Enqueue(ctx, userId, notificationData); err != nil {
			logCtx.Error("Failed to enqueue event confirmation notification",
				"error", err,
				"userId", userId,
				"topic", TopicEventConfirmed)
		} else {
			logCtx.Debug("Event confirmation notification queued",
				"userId", userId,
				"userName", userName,
				"hostName", hostName,
				"dateTime", dateTime,
				"location", facilityName)
		}
	}
}

func (d *AllPurposeNotifier) UserJoined(logCtx slog.Logger, joinRequest api.JoinRequestData) {
	// Since we can't extract userId from slog directly, we'll skip this notification for now
	// TODO: Modify server interface to pass userId directly or implement proper context passing
	logCtx.Warn("UserJoined notification skipped - cannot determine joining user ID from current interface", "eventId", joinRequest.EventId)
}
