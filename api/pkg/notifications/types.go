package notifications

// Notification template types - these are universal across all channels
// (email, SMS, browser push, in-app, Telegram, etc.)
const (
	// TemplateEventConfirmed is sent when an event is confirmed by the host
	TemplateEventConfirmed = "event_confirmed"

	// TemplateUserJoined is sent to the host when someone requests to join their event
	TemplateUserJoined = "user_joined"

	// TemplateEventExpired is sent when an event expires without participants
	TemplateEventExpired = "event_expired"
)

// Template data field conventions for NotificationQueueData.TemplateData
// These are the standard field names used across all notification channels.
// Each channel renderer can use these to generate appropriate content.
//
// Common fields (applicable to most templates):
//   - RecipientName (string): Name of the notification recipient
//   - ActionURL (string): Primary action URL/deep link (relative path, e.g., "/events/123")
//
// EventConfirmed template fields:
//   - RecipientName (string): Name of the person receiving the notification
//   - IsHost (bool): Whether the recipient is the event host
//   - HostName (string): Name of the event host
//   - DateTime (string): Formatted date and time of the event
//   - Location (string): Name of the event location/facility
//   - ConfirmedPlayers ([]string): List of confirmed player names
//   - EventId (string): Event identifier for deep linking
//
// UserJoined template fields:
//   - HostName (string): Name of the event host receiving the notification
//   - JoiningUser (string): Name of the user requesting to join
//   - Comment (string): Optional comment from the joining user
//   - EventId (string): Event identifier for deep linking
//
// EventExpired template fields:
//   - RecipientName (string): Name of the event owner
//   - EventId (string): Expired event identifier

// TemplateDataKeys provides constants for template data field names
// to avoid magic strings and ensure consistency across channels
var TemplateDataKeys = struct {
	// Common fields
	RecipientName string
	ActionURL     string

	// Event fields
	EventId    string
	HostName   string
	DateTime   string
	Location   string
	IsHost     string

	// User joined fields
	JoiningUser string
	Comment     string

	// Event confirmed fields
	ConfirmedPlayers string
}{
	RecipientName:    "RecipientName",
	ActionURL:        "ActionURL",
	EventId:          "EventId",
	HostName:         "HostName",
	DateTime:         "DateTime",
	Location:         "Location",
	IsHost:           "IsHost",
	JoiningUser:      "JoiningUser",
	Comment:          "Comment",
	ConfirmedPlayers: "ConfirmedPlayers",
}

