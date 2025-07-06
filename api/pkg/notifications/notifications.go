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
}

// notify player joined event
// notiy event confirmed by host
type AllPurposeNotifier struct {
	db NotifierDb
}

func NewAllPurposeNotifier(db NotifierDb) *AllPurposeNotifier {
	return &AllPurposeNotifier{
		db: db,
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

	// Create notification messages
	for _, userId := range joinRequestIds {
		prefs, exists := userNotifPrefs[userId]
		if !exists {
			logCtx.Warn("No notification preferences found for user", "userId", userId)
			continue
		}

		userName := userNames[userId]
		if userName == "" {
			userName = "Unknown User"
		}

		msg := fmt.Sprintf("Hello %s, your event join request has been confirmed by %s. The event will take place on %s at %s. Email: %s, Phone: %s",
			userName, hostName, dateTime, facilityName, prefs.Email, prefs.PhoneNumber)

		logCtx.Info("Event confirmation notification",
			"userId", userId,
			"userName", userName,
			"hostName", hostName,
			"dateTime", dateTime,
			"location", facilityName,
			"message", msg)
	}
}

func (d *AllPurposeNotifier) UserJoined(logCtx slog.Logger, joinRequest api.JoinRequestData) {
	logCtx.Info("User joined event notification",
		"joinRequestId", joinRequest.Id,
		"eventId", joinRequest.EventId,
		"comment", joinRequest.Comment)
}
