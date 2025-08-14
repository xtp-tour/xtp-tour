package calendar

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

// Service handles Google Calendar integration
type Service struct {
	config *oauth2.Config
	db     *db.Db
}

// NewService creates a new calendar service
func NewService(authConfig AuthConfig, database *db.Db) *Service {
	config := &oauth2.Config{
		ClientID:     authConfig.ClientID,
		ClientSecret: authConfig.ClientSecret,
		RedirectURL:  authConfig.RedirectURL,
		Scopes:       authConfig.Scopes,
		Endpoint:     google.Endpoint,
	}

	return &Service{
		config: config,
		db:     database,
	}
}

// GetAuthURL generates OAuth authorization URL
func (s *Service) GetAuthURL(userID string) string {
	return s.config.AuthCodeURL(userID, oauth2.AccessTypeOffline)
}

// HandleCallback processes OAuth callback and stores tokens
func (s *Service) HandleCallback(ctx context.Context, userID, code string) error {
	token, err := s.config.Exchange(ctx, code)
	if err != nil {
		return fmt.Errorf("failed to exchange code for token: %w", err)
	}

	// Store the connection in database
	connection := &db.UserCalendarConnectionRow{
		UserId:       userID,
		Provider:     "google",
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		TokenExpiry:  token.Expiry,
		CalendarId:   "primary",
		IsActive:     true,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	return s.db.UpsertCalendarConnection(ctx, connection)
}

// GetBusyTimes retrieves busy periods from Google Calendar
func (s *Service) GetBusyTimes(ctx context.Context, userID string, timeMin, timeMax time.Time) (*FreeBusyResponse, error) {
	// Get user's calendar connection
	connection, err := s.db.GetCalendarConnection(ctx, userID, "google")
	if err != nil {
		return nil, fmt.Errorf("failed to get calendar connection: %w", err)
	}

	if !connection.IsActive {
		return nil, fmt.Errorf("calendar connection is not active")
	}

	// Create OAuth token
	token := &oauth2.Token{
		AccessToken:  connection.AccessToken,
		RefreshToken: connection.RefreshToken,
		Expiry:       connection.TokenExpiry,
		TokenType:    "Bearer",
	}

	// Check if token needs refresh
	if token.Expiry.Before(time.Now().Add(5 * time.Minute)) {
		token, err = s.refreshToken(ctx, userID, token)
		if err != nil {
			return nil, fmt.Errorf("failed to refresh token: %w", err)
		}
	}

	// Create calendar service
	client := s.config.Client(ctx, token)
	calendarService, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("failed to create calendar service: %w", err)
	}

	// Query free/busy information
	freeBusyRequest := &calendar.FreeBusyRequest{
		TimeMin: timeMin.Format(time.RFC3339),
		TimeMax: timeMax.Format(time.RFC3339),
		Items: []*calendar.FreeBusyRequestItem{
			{Id: connection.CalendarId},
		},
	}

	freeBusyResponse, err := calendarService.Freebusy.Query(freeBusyRequest).Do()
	if err != nil {
		return nil, fmt.Errorf("failed to query free/busy: %w", err)
	}

	// Parse busy periods
	var busyPeriods []BusyPeriod
	if calendarData, exists := freeBusyResponse.Calendars[connection.CalendarId]; exists {
		for _, busyTime := range calendarData.Busy {
			startTime, err := time.Parse(time.RFC3339, busyTime.Start)
			if err != nil {
				log.Printf("Failed to parse start time: %v", err)
				continue
			}
			endTime, err := time.Parse(time.RFC3339, busyTime.End)
			if err != nil {
				log.Printf("Failed to parse end time: %v", err)
				continue
			}

			busyPeriods = append(busyPeriods, BusyPeriod{
				Start: startTime,
				End:   endTime,
				Title: "Busy", // We'll get event details in a separate call if needed
			})
		}
	}

	response := &FreeBusyResponse{
		BusyPeriods: busyPeriods,
		CalendarID:  connection.CalendarId,
		SyncedAt:    time.Now(),
	}

	// Cache the busy times in database
	err = s.cacheBusyTimes(ctx, userID, busyPeriods)
	if err != nil {
		log.Printf("Failed to cache busy times: %v", err)
		// Don't fail the request, just log the error
	}

	return response, nil
}

// GetConnectionStatus checks if user has an active calendar connection
func (s *Service) GetConnectionStatus(ctx context.Context, userID string) (*CalendarConnection, error) {
	connection, err := s.db.GetCalendarConnection(ctx, userID, "google")
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return nil, nil // No connection found
		}
		return nil, err
	}

	return &CalendarConnection{
		ID:          connection.Id,
		UserID:      connection.UserId,
		Provider:    connection.Provider,
		CalendarID:  connection.CalendarId,
		IsActive:    connection.IsActive,
		TokenExpiry: connection.TokenExpiry,
		CreatedAt:   connection.CreatedAt,
		UpdatedAt:   connection.UpdatedAt,
	}, nil
}

// DisconnectCalendar deactivates the user's calendar connection
func (s *Service) DisconnectCalendar(ctx context.Context, userID string) error {
	return s.db.DeactivateCalendarConnection(ctx, userID, "google")
}

// refreshToken refreshes an expired OAuth token
func (s *Service) refreshToken(ctx context.Context, userID string, token *oauth2.Token) (*oauth2.Token, error) {
	tokenSource := s.config.TokenSource(ctx, token)
	newToken, err := tokenSource.Token()
	if err != nil {
		return nil, err
	}

	// Update token in database
	connection := &db.UserCalendarConnectionRow{
		UserId:       userID,
		Provider:     "google",
		AccessToken:  newToken.AccessToken,
		RefreshToken: newToken.RefreshToken,
		TokenExpiry:  newToken.Expiry,
		UpdatedAt:    time.Now(),
	}

	err = s.db.UpdateCalendarConnectionTokens(ctx, connection)
	if err != nil {
		return nil, fmt.Errorf("failed to update tokens in database: %w", err)
	}

	return newToken, nil
}

// cacheBusyTimes stores busy periods in database for caching
func (s *Service) cacheBusyTimes(ctx context.Context, userID string, busyPeriods []BusyPeriod) error {
	// Clear existing cached busy times for this user
	err := s.db.ClearCachedBusyTimes(ctx, userID)
	if err != nil {
		return err
	}

	// Insert new busy times
	for _, period := range busyPeriods {
		busyTime := &db.CalendarBusyTimeRow{
			UserId:     userID,
			StartTime:  period.Start,
			EndTime:    period.End,
			EventTitle: period.Title,
			SyncedAt:   time.Now(),
		}

		err = s.db.InsertBusyTime(ctx, busyTime)
		if err != nil {
			return err
		}
	}

	return nil
}

// GetDefaultScopes returns the default OAuth scopes for Google Calendar
func GetDefaultScopes() []string {
	return []string{
		calendar.CalendarReadonlyScope,
	}
}