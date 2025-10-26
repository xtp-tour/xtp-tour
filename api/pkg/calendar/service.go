package calendar

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/xtp-tour/xtp-tour/api/pkg/crypto"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

// Service handles Google Calendar integration
type Service struct {
	config     *oauth2.Config
	db         *db.Db
	encryption *crypto.TokenEncryption
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

	// Initialize token encryption
	encryption := crypto.MustInitTokenEncryption()

	return &Service{
		config:     config,
		db:         database,
		encryption: encryption,
	}
}

// GetAuthURL generates OAuth authorization URL with secure state parameter
func (s *Service) GetAuthURL(userID string) string {
	// Generate secure state parameter that includes user ID
	state := s.generateStateParameter(userID)
	authUrl := s.config.AuthCodeURL(state, oauth2.AccessTypeOffline, oauth2.ApprovalForce)
	slog.Debug("Auth URL", "authUrl", authUrl)
	return authUrl
}

// generateStateParameter creates a secure state parameter containing the user ID
func (s *Service) generateStateParameter(userID string) string {
	// Generate random bytes for security
	randomBytes := make([]byte, 16)
	_, err := rand.Read(randomBytes)
	if err != nil {
		slog.Error("Failed to generate random bytes for state", "error", err)
		// Fallback to timestamp-based randomness (less secure but functional)
		randomBytes = []byte(fmt.Sprintf("%d", time.Now().UnixNano()))
	}

	randomStr := base64.URLEncoding.EncodeToString(randomBytes)
	// Format: userID:randomString
	return fmt.Sprintf("%s:%s", userID, randomStr)
}

// validateStateParameter validates the state parameter and extracts user ID
func (s *Service) validateStateParameter(state, expectedUserID string) error {
	if state == "" {
		return fmt.Errorf("state parameter is required")
	}

	parts := strings.SplitN(state, ":", 2)
	if len(parts) != 2 {
		return fmt.Errorf("invalid state parameter format")
	}

	stateUserID := parts[0]
	if stateUserID != expectedUserID {
		return fmt.Errorf("state parameter user ID mismatch")
	}

	return nil
}

// HandleCallback processes OAuth callback and stores tokens
func (s *Service) HandleCallback(ctx context.Context, userID, code, state string) error {
	// Validate state parameter to prevent CSRF attacks
	if err := s.validateStateParameter(state, userID); err != nil {
		return fmt.Errorf("state validation failed: %w", err)
	}

	token, err := s.config.Exchange(ctx, code)
	if err != nil {
		return fmt.Errorf("failed to exchange code for token: %w", err)
	}

	// Check if refresh token is present
	if token.RefreshToken == "" {
		slog.Warn("No refresh token received from Google OAuth", "userID", userID)
		return fmt.Errorf("no refresh token received from Google - user may need to revoke access and re-authorize")
	}

	// Encrypt tokens before storage
	encryptedAccessToken, err := s.encryption.EncryptToken(token.AccessToken)
	if err != nil {
		return fmt.Errorf("failed to encrypt access token: %w", err)
	}

	encryptedRefreshToken, err := s.encryption.EncryptToken(token.RefreshToken)
	if err != nil {
		return fmt.Errorf("failed to encrypt refresh token: %w", err)
	}

	// Store the connection in database with encrypted tokens
	connection := &db.UserCalendarConnectionRow{
		UserId:       userID,
		Provider:     "google",
		AccessToken:  encryptedAccessToken,
		RefreshToken: encryptedRefreshToken,
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

	calendarService, calendarId, err := s.getCalendarService(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Query free/busy information
	freeBusyRequest := &calendar.FreeBusyRequest{
		TimeMin: timeMin.Format(time.RFC3339),
		TimeMax: timeMax.Format(time.RFC3339),
		Items: []*calendar.FreeBusyRequestItem{
			{Id: calendarId},
		},
	}

	freeBusyResponse, err := calendarService.Freebusy.Query(freeBusyRequest).Do()
	if err != nil {
		return nil, fmt.Errorf("failed to query free/busy: %w", err)
	}

	// Parse busy periods
	var busyPeriods []BusyPeriod
	if calendarData, exists := freeBusyResponse.Calendars[calendarId]; exists {
		for _, busyTime := range calendarData.Busy {
			startTime, err := time.Parse(time.RFC3339, busyTime.Start)
			if err != nil {
				slog.Error("Failed to parse start time", "error", err)
				continue
			}
			endTime, err := time.Parse(time.RFC3339, busyTime.End)
			if err != nil {
				slog.Error("Failed to parse end time", "error", err)
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
		CalendarID:  calendarId,
		SyncedAt:    time.Now(),
	}

	// Cache the busy times in database
	err = s.cacheBusyTimes(ctx, userID, busyPeriods)
	if err != nil {
		slog.Error("Failed to cache busy times", "error", err, "userID", userID)
		// Don't fail the request, just log the error
	}

	return response, nil
}

// getCalendarService retrieves a Google Calendar service client for a user
func (s *Service) getCalendarService(ctx context.Context, userID string) (*calendar.Service, string, error) {
	// Get user's calendar connection
	connection, err := s.db.GetCalendarConnection(ctx, userID, "google")
	if err != nil {
		return nil, "", fmt.Errorf("failed to get calendar connection: %w", err)
	}

	if !connection.IsActive {
		return nil, "", fmt.Errorf("calendar connection is not active")
	}

	// Decrypt tokens
	accessToken, err := s.encryption.DecryptToken(connection.AccessToken)
	if err != nil {
		return nil, "", fmt.Errorf("failed to decrypt access token: %w", err)
	}

	refreshToken, err := s.encryption.DecryptToken(connection.RefreshToken)
	if err != nil {
		return nil, "", fmt.Errorf("failed to decrypt refresh token: %w", err)
	}

	// Create OAuth token
	token := &oauth2.Token{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		Expiry:       connection.TokenExpiry,
		TokenType:    "Bearer",
	}

	// Check if token needs refresh
	if token.Expiry.Before(time.Now().Add(5 * time.Minute)) {
		token, err = s.refreshToken(ctx, userID, token)
		if err != nil {
			return nil, "", fmt.Errorf("failed to refresh token: %w", err)
		}
	}

	// Create calendar service
	client := s.config.Client(ctx, token)
	calendarService, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, "", fmt.Errorf("failed to create calendar service: %w", err)
	}
	return calendarService, connection.CalendarId, nil
}

// ListCalendars retrieves the list of calendars for the user from Google
func (s *Service) ListCalendars(ctx context.Context, userID string) ([]UserCalendar, error) {
	calendarService, _, err := s.getCalendarService(ctx, userID)
	if err != nil {
		return nil, err
	}

	list, err := calendarService.CalendarList.List().Do()
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve calendar list: %w", err)
	}

	var calendars []UserCalendar
	for _, item := range list.Items {
		calendars = append(calendars, UserCalendar{
			ID:      item.Id,
			Summary: item.Summary,
			Primary: item.Primary,
		})
	}

	return calendars, nil
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
		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}

	// Encrypt new tokens before storage
	encryptedAccessToken, err := s.encryption.EncryptToken(newToken.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt new access token: %w", err)
	}

	encryptedRefreshToken, err := s.encryption.EncryptToken(newToken.RefreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt new refresh token: %w", err)
	}

	// Update token in database with encrypted values
	connection := &db.UserCalendarConnectionRow{
		UserId:       userID,
		Provider:     "google",
		AccessToken:  encryptedAccessToken,
		RefreshToken: encryptedRefreshToken,
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

// NewServiceAccountService creates a calendar service using service account authentication
// This is used for testing purposes
func NewServiceAccountService(serviceAccountKeyPath, serviceAccountEmail string) (*calendar.Service, error) {
	ctx := context.Background()

	// Create service account credentials
	client, err := google.DefaultClient(ctx, calendar.CalendarReadonlyScope)
	if err != nil {
		return nil, fmt.Errorf("failed to create service account client: %w", err)
	}

	// Create calendar service with service account
	calendarService, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("failed to create calendar service with service account: %w", err)
	}

	return calendarService, nil
}

// GetTestBusyTimes retrieves busy periods from a test calendar using service account
func GetTestBusyTimes(calendarService *calendar.Service, calendarID string, timeMin, timeMax time.Time) (*FreeBusyResponse, error) {
	// Query free/busy information using service account
	freeBusyRequest := &calendar.FreeBusyRequest{
		TimeMin: timeMin.Format(time.RFC3339),
		TimeMax: timeMax.Format(time.RFC3339),
		Items: []*calendar.FreeBusyRequestItem{
			{Id: calendarID},
		},
	}

	freeBusyResponse, err := calendarService.Freebusy.Query(freeBusyRequest).Do()
	if err != nil {
		return nil, fmt.Errorf("failed to query free/busy with service account: %w", err)
	}

	// Parse busy periods
	var busyPeriods []BusyPeriod
	if calendarData, exists := freeBusyResponse.Calendars[calendarID]; exists {
		for _, busyTime := range calendarData.Busy {
			startTime, err := time.Parse(time.RFC3339, busyTime.Start)
			if err != nil {
				slog.Error("Failed to parse start time", "error", err)
				continue
			}
			endTime, err := time.Parse(time.RFC3339, busyTime.End)
			if err != nil {
				slog.Error("Failed to parse end time", "error", err)
				continue
			}

			busyPeriods = append(busyPeriods, BusyPeriod{
				Start: startTime,
				End:   endTime,
				Title: "Test Event",
			})
		}
	}

	return &FreeBusyResponse{
		BusyPeriods: busyPeriods,
		CalendarID:  calendarID,
		SyncedAt:    time.Now(),
	}, nil
}
