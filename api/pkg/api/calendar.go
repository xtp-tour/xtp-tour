package api

import "time"

// Calendar API types

// CalendarAuthURLResponse represents the response for getting OAuth URL
type CalendarAuthURLResponse struct {
	AuthURL string `json:"authUrl"`
}

// CalendarCallbackRequest represents the OAuth callback request
type CalendarCallbackRequest struct {
	Code  string `query:"code"`
	State string `query:"state"`
	Scope string `query:"scope"`
}

// CalendarConnectionStatusResponse represents the calendar connection status
type CalendarConnectionStatusResponse struct {
	Connected   bool      `json:"connected"`
	Provider    string    `json:"provider,omitempty"`
	CalendarID  string    `json:"calendarId,omitempty"`
	TokenExpiry time.Time `json:"tokenExpiry,omitempty"`
	CreatedAt   time.Time `json:"createdAt,omitempty"`
}

// CalendarBusyTimesRequest represents request for busy times
type CalendarBusyTimesRequest struct {
	TimeMin time.Time `query:"timeMin"`
	TimeMax time.Time `query:"timeMax"`
}

// CalendarBusyPeriod represents a busy time period
type CalendarBusyPeriod struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
	Title string    `json:"title,omitempty"`
}

// CalendarBusyTimesResponse represents response with busy periods
type CalendarBusyTimesResponse struct {
	BusyPeriods []CalendarBusyPeriod `json:"busyPeriods"`
	CalendarID  string               `json:"calendarId"`
	SyncedAt    time.Time            `json:"syncedAt"`
}

// CalendarPreferencesRequest represents calendar preferences update
type CalendarPreferencesRequest struct {
	SyncEnabled          bool `json:"syncEnabled"`
	SyncFrequencyMinutes int  `json:"syncFrequencyMinutes"`
	ShowEventDetails     bool `json:"showEventDetails"`
}

// CalendarPreferencesResponse represents calendar preferences
type CalendarPreferencesResponse struct {
	SyncEnabled          bool      `json:"syncEnabled"`
	SyncFrequencyMinutes int       `json:"syncFrequencyMinutes"`
	ShowEventDetails     bool      `json:"showEventDetails"`
	UpdatedAt            time.Time `json:"updatedAt"`
}

// UserCalendar represents a calendar available for sync
type UserCalendar struct {
	ID      string `json:"id"`
	Summary string `json:"summary"`
	Primary bool   `json:"primary"`
}

// UserCalendarsResponse is a list of calendars
type UserCalendarsResponse struct {
	Calendars []UserCalendar `json:"calendars"`
}
