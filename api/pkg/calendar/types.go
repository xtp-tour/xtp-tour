package calendar

import (
	"time"
)

// BusyPeriod represents a time period when the user is busy
type BusyPeriod struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
	Title string    `json:"title,omitempty"`
}

// CalendarConnection represents a user's calendar connection
type CalendarConnection struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	Provider    string    `json:"provider"`
	CalendarID  string    `json:"calendarId"`
	IsActive    bool      `json:"isActive"`
	TokenExpiry time.Time `json:"tokenExpiry"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// CalendarPreferences represents user's calendar sync preferences
type CalendarPreferences struct {
	UserID               string `json:"userId"`
	SyncEnabled          bool   `json:"syncEnabled"`
	SyncFrequencyMinutes int    `json:"syncFrequencyMinutes"`
	ShowEventDetails     bool   `json:"showEventDetails"`
}

// AuthConfig holds OAuth configuration
type AuthConfig struct {
	ClientID     string   `json:"clientId"`
	ClientSecret string   `json:"clientSecret"`
	RedirectURL  string   `json:"redirectUrl"`
	Scopes       []string `json:"scopes"`
}

// TokenResponse represents OAuth token response
type TokenResponse struct {
	AccessToken  string    `json:"accessToken"`
	RefreshToken string    `json:"refreshToken"`
	TokenType    string    `json:"tokenType"`
	ExpiresIn    int       `json:"expiresIn"`
	Expiry       time.Time `json:"expiry"`
}

// FreeBusyRequest represents request for busy time periods
type FreeBusyRequest struct {
	TimeMin    time.Time `json:"timeMin"`
	TimeMax    time.Time `json:"timeMax"`
	CalendarID string    `json:"calendarId"`
}

// FreeBusyResponse represents response with busy periods
type FreeBusyResponse struct {
	BusyPeriods []BusyPeriod `json:"busyPeriods"`
	CalendarID  string       `json:"calendarId"`
	SyncedAt    time.Time    `json:"syncedAt"`
}
