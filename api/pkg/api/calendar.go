package api

import "time"

// Calendar API types

// CalendarAuthURLResponse represents the response for getting OAuth URL
type CalendarAuthURLResponse struct {
	AuthURL string `json:"authUrl"`
}

// CalendarCallbackRequest represents the OAuth callback request
type CalendarCallbackRequest struct {
	Code  string `json:"code"`
	State string `json:"state"`
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
	TimeMin time.Time `json:"timeMin"`
	TimeMax time.Time `json:"timeMax"`
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
