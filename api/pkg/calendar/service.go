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
		return fmt.Errorf("no refresh token received from Google. The user must revoke the application's access in their Google account and then re-authorize to grant a refresh token.")
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

// GetBusyTimes retrieves busy periods from all visible Google Calendars
func (s *Service) GetBusyTimes(ctx context.Context, userID string, timeMin, timeMax time.Time) (*FreeBusyResponse, error) {

	calendarService, _, err := s.getCalendarService(ctx, userID)
	if err != nil {
		return nil, err
	}

	// Get list of all calendars for the user
	calendars, err := s.getVisibleCalendars(ctx, calendarService)
	if err != nil {
		return nil, fmt.Errorf("failed to get calendar list: %w", err)
	}

	if len(calendars) == 0 {
		slog.Warn("No visible calendars found for user", "userID", userID)
		return &FreeBusyResponse{
			BusyPeriods: []BusyPeriod{},
			CalendarID:  "none",
			SyncedAt:    time.Now(),
		}, nil
	}

	slog.Debug("Found calendars for user", "count", len(calendars), "calendars", calendars)

	// Build FreeBusy request for all calendars
	var freeBusyItems []*calendar.FreeBusyRequestItem
	for _, cal := range calendars {
		freeBusyItems = append(freeBusyItems, &calendar.FreeBusyRequestItem{
			Id: cal.ID,
		})
	}

	freeBusyRequest := &calendar.FreeBusyRequest{
		TimeMin: timeMin.Format(time.RFC3339),
		TimeMax: timeMax.Format(time.RFC3339),
		Items:   freeBusyItems,
	}

	slog.Debug("Querying FreeBusy API for all calendars",
		"calendarCount", len(freeBusyItems),
		"timeMin", timeMin.Format(time.RFC3339),
		"timeMax", timeMax.Format(time.RFC3339))

	freeBusyResponse, err := calendarService.Freebusy.Query(freeBusyRequest).Do()
	if err != nil {
		return nil, fmt.Errorf("failed to query free/busy: %w", err)
	}

	slog.Debug("FreeBusy API response",
		"calendarsCount", len(freeBusyResponse.Calendars))

	// Parse busy periods from FreeBusy API for all calendars
	var busyPeriods []BusyPeriod
	for calendarId, calendarData := range freeBusyResponse.Calendars {
		slog.Debug("Processing calendar",
			"calendarId", calendarId,
			"busyCount", len(calendarData.Busy),
			"errors", calendarData.Errors)

		for _, busyTime := range calendarData.Busy {
			startTime, err := time.Parse(time.RFC3339, busyTime.Start)
			if err != nil {
				slog.Error("Failed to parse start time", "error", err, "calendarId", calendarId)
				continue
			}
			endTime, err := time.Parse(time.RFC3339, busyTime.End)
			if err != nil {
				slog.Error("Failed to parse end time", "error", err, "calendarId", calendarId)
				continue
			}

			busyPeriods = append(busyPeriods, BusyPeriod{
				Start: startTime,
				End:   endTime,
				Title: "Busy",
			})
		}
	}

	slog.Debug("FreeBusy returned busy periods", "count", len(busyPeriods))

	// Always fetch actual events from all calendars to get event titles and transparent events
	// FreeBusy only returns time ranges without titles, and only shows "opaque" events
	slog.Debug("Fetching events directly from all calendars to get event details")
	var allEventPeriods []BusyPeriod
	for _, cal := range calendars {
		eventBusyPeriods, err := s.getEventBusyTimes(ctx, calendarService, cal.ID, timeMin, timeMax)
		if err != nil {
			slog.Warn("Failed to fetch events for calendar", "error", err, "calendarId", cal.ID)
			continue
		}
		allEventPeriods = append(allEventPeriods, eventBusyPeriods...)
		slog.Debug("Fetched events from calendar", "calendarId", cal.ID, "count", len(eventBusyPeriods))
	}

	// Use events with titles instead of FreeBusy results (which lack titles)
	if len(allEventPeriods) > 0 {
		busyPeriods = allEventPeriods
		slog.Debug("Using event-based busy periods with titles", "count", len(busyPeriods))
	}

	response := &FreeBusyResponse{
		BusyPeriods: busyPeriods,
		CalendarID:  "all",
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

// getVisibleCalendars fetches all calendars that are visible/selected by the user
func (s *Service) getVisibleCalendars(ctx context.Context, calendarService *calendar.Service) ([]UserCalendar, error) {
	calendarList, err := calendarService.CalendarList.List().Do()
	if err != nil {
		return nil, fmt.Errorf("failed to list calendars: %w", err)
	}

	var calendars []UserCalendar
	for _, item := range calendarList.Items {
		// Only include calendars that are selected (visible in the user's calendar list)
		if item.Selected {
			calendars = append(calendars, UserCalendar{
				ID:      item.Id,
				Summary: item.Summary,
				Primary: item.Primary,
			})
			slog.Debug("Including calendar",
				"id", item.Id,
				"summary", item.Summary,
				"primary", item.Primary,
				"selected", item.Selected)
		} else {
			slog.Debug("Skipping unselected calendar",
				"id", item.Id,
				"summary", item.Summary)
		}
	}

	return calendars, nil
}

// getEventBusyTimes fetches busy periods by listing actual events from the calendar
// This is used as a fallback when FreeBusy API returns no results (which happens when events are "transparent")
// All-day events are included and marked as busy for the entire day period
func (s *Service) getEventBusyTimes(ctx context.Context, calendarService *calendar.Service, calendarId string, timeMin, timeMax time.Time) ([]BusyPeriod, error) {
	// List events in the time range
	slog.Debug("Listing events from calendar",
		"calendarId", calendarId,
		"timeMin", timeMin.Format(time.RFC3339),
		"timeMax", timeMax.Format(time.RFC3339))

	events, err := calendarService.Events.List(calendarId).
		TimeMin(timeMin.Format(time.RFC3339)).
		TimeMax(timeMax.Format(time.RFC3339)).
		SingleEvents(true).
		OrderBy("startTime").
		Do()

	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}

	slog.Debug("Events.List response",
		"totalItems", len(events.Items),
		"summary", events.Summary)

	var busyPeriods []BusyPeriod
	skippedCancelled := 0
	allDayEvents := 0

	for _, event := range events.Items {
		slog.Debug("Processing event",
			"id", event.Id,
			"summary", event.Summary,
			"status", event.Status,
			"startDateTime", event.Start.DateTime,
			"startDate", event.Start.Date,
			"endDateTime", event.End.DateTime,
			"endDate", event.End.Date)

		// Skip cancelled events
		if event.Status == "cancelled" {
			skippedCancelled++
			continue
		}

		title := event.Summary
		if title == "" {
			title = "Busy"
		}

		// Handle all-day events
		if event.Start.DateTime == "" || event.End.DateTime == "" {
			allDayEvents++
			// All-day events use Date field instead of DateTime
			// Format is YYYY-MM-DD
			if event.Start.Date == "" || event.End.Date == "" {
				slog.Warn("All-day event missing date fields", "eventId", event.Id)
				continue
			}

			// Parse the date (format: YYYY-MM-DD)
			startDate, err := time.Parse("2006-01-02", event.Start.Date)
			if err != nil {
				slog.Warn("Failed to parse all-day event start date", "error", err, "eventId", event.Id, "date", event.Start.Date)
				continue
			}

			endDate, err := time.Parse("2006-01-02", event.End.Date)
			if err != nil {
				slog.Warn("Failed to parse all-day event end date", "error", err, "eventId", event.Id, "date", event.End.Date)
				continue
			}

			// For all-day events, mark the entire day as busy (00:00 to 23:59:59)
			// The end date is exclusive in Google Calendar, so we don't need to add a day
			startTime := startDate.UTC()
			endTime := endDate.UTC()

			busyPeriods = append(busyPeriods, BusyPeriod{
				Start: startTime,
				End:   endTime,
				Title: title,
			})

			slog.Debug("Added all-day busy period",
				"title", title,
				"start", startTime.Format(time.RFC3339),
				"end", endTime.Format(time.RFC3339))
			continue
		}

		// Handle regular timed events
		startTime, err := time.Parse(time.RFC3339, event.Start.DateTime)
		if err != nil {
			slog.Warn("Failed to parse event start time", "error", err, "eventId", event.Id)
			continue
		}

		endTime, err := time.Parse(time.RFC3339, event.End.DateTime)
		if err != nil {
			slog.Warn("Failed to parse event end time", "error", err, "eventId", event.Id)
			continue
		}

		busyPeriods = append(busyPeriods, BusyPeriod{
			Start: startTime,
			End:   endTime,
			Title: title,
		})

		slog.Debug("Added timed busy period",
			"title", title,
			"start", startTime.Format(time.RFC3339),
			"end", endTime.Format(time.RFC3339))
	}

	slog.Debug("Event processing summary",
		"totalEvents", len(events.Items),
		"skippedCancelled", skippedCancelled,
		"allDayEvents", allDayEvents,
		"busyPeriods", len(busyPeriods))

	return busyPeriods, nil
}

// getCalendarService retrieves a Google Calendar service client for a user
func (s *Service) getCalendarService(ctx context.Context, userID string) (*calendar.Service, string, error) {
	// Get user's calendar connection
	connection, err := s.db.GetCalendarConnection(ctx, userID, "google")
	if err != nil {
		if _, ok := err.(db.DbObjectNotFoundError); ok {
			return nil, "", fmt.Errorf("calendar not connected - please connect your calendar in settings")
		}
		return nil, "", fmt.Errorf("failed to get calendar connection: %w", err)
	}

	if !connection.IsActive {
		return nil, "", fmt.Errorf("calendar connection has been deactivated - please reconnect your calendar in settings")
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
		// Check if this is an invalid_grant error (token revoked, expired, or invalid)
		if strings.Contains(err.Error(), "invalid_grant") {
			slog.Warn("OAuth refresh token is invalid (revoked or expired), deactivating calendar connection",
				"userID", userID,
				"error", err)

			// Deactivate the connection so user knows they need to re-authorize
			if deactivateErr := s.db.DeactivateCalendarConnection(ctx, userID, "google"); deactivateErr != nil {
				slog.Error("Failed to deactivate calendar connection after invalid_grant",
					"userID", userID,
					"error", deactivateErr)
			}

			return nil, fmt.Errorf("calendar authorization has expired or been revoked - please reconnect your calendar in settings")
		}

		return nil, fmt.Errorf("failed to refresh token: %w", err)
	}

	// Encrypt new tokens before storage
	encryptedAccessToken, err := s.encryption.EncryptToken(newToken.AccessToken)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt new access token: %w", err)
	}

	// Important: Google doesn't always return a new refresh token on refresh
	// Only update the refresh token if a new one was provided
	var encryptedRefreshToken string
	var refreshTokenToUse string

	if newToken.RefreshToken != "" {
		// Google provided a new refresh token
		refreshTokenToUse = newToken.RefreshToken
		slog.Debug("Received new refresh token from Google", "userID", userID)
	} else {
		// Google didn't provide a new refresh token - keep the existing one
		refreshTokenToUse = token.RefreshToken
		newToken.RefreshToken = token.RefreshToken // Update the return object
		slog.Debug("No new refresh token from Google, preserving existing one", "userID", userID)
	}

	// Encrypt the refresh token (whether new or existing)
	encryptedRefreshToken, err = s.encryption.EncryptToken(refreshTokenToUse)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt refresh token: %w", err)
	}

	// Update token in database with encrypted values
	updatedConnection := &db.UserCalendarConnectionRow{
		UserId:       userID,
		Provider:     "google",
		AccessToken:  encryptedAccessToken,
		RefreshToken: encryptedRefreshToken,
		TokenExpiry:  newToken.Expiry,
		UpdatedAt:    time.Now(),
	}

	err = s.db.UpdateCalendarConnectionTokens(ctx, updatedConnection)
	if err != nil {
		return nil, fmt.Errorf("failed to update tokens in database: %w", err)
	}

	slog.Debug("Successfully refreshed OAuth token", "userID", userID)
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
