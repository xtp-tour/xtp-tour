package googlecalendar

import (
	"context"
	"fmt"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

// Service handles Google Calendar operations
type Service struct {
	config *oauth2.Config
}

// CalendarEvent represents a Google Calendar event
type CalendarEvent struct {
	ID          string    `json:"id"`
	Summary     string    `json:"summary"`
	Start       time.Time `json:"start"`
	End         time.Time `json:"end"`
	Location    string    `json:"location,omitempty"`
	Description string    `json:"description,omitempty"`
}

// TokenInfo represents stored OAuth tokens
type TokenInfo struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	Expiry      time.Time `json:"expiry"`
	TokenType   string    `json:"token_type"`
}

// NewService creates a new Google Calendar service
func NewService(clientID, clientSecret string) *Service {
	config := &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		RedirectURL:  "urn:ietf:wg:oauth:2.0:oob", // For desktop/backend apps
		Scopes:       []string{calendar.CalendarScope},
		Endpoint:     google.Endpoint,
	}

	return &Service{config: config}
}

// GetAuthURL generates the OAuth authorization URL
func (s *Service) GetAuthURL() string {
	return s.config.AuthCodeURL("state")
}

// ExchangeCode exchanges an authorization code for tokens
func (s *Service) ExchangeCode(code string) (*oauth2.Token, error) {
	return s.config.Exchange(context.Background(), code)
}

// RefreshToken refreshes an expired access token
func (s *Service) RefreshToken(refreshToken string) (*oauth2.Token, error) {
	token := &oauth2.Token{
		RefreshToken: refreshToken,
	}
	
	ctx := context.Background()
	return s.config.TokenSource(ctx, token).Token()
}

// GetEvents retrieves calendar events for a date range
func (s *Service) GetEvents(token *oauth2.Token, startDate, endDate time.Time) ([]CalendarEvent, error) {
	ctx := context.Background()
	client := s.config.Client(ctx, token)

	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("failed to create calendar service: %w", err)
	}

	events, err := srv.Events.List("primary").
		TimeMin(startDate.Format(time.RFC3339)).
		TimeMax(endDate.Format(time.RFC3339)).
		SingleEvents(true).
		OrderBy("startTime").
		Do()

	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}

	var result []CalendarEvent
	for _, event := range events.Items {
		start, _ := time.Parse(time.RFC3339, event.Start.DateTime)
		end, _ := time.Parse(time.RFC3339, event.End.DateTime)

		result = append(result, CalendarEvent{
			ID:          event.Id,
			Summary:     event.Summary,
			Start:       start,
			End:         end,
			Location:    event.Location,
			Description: event.Description,
		})
	}

	return result, nil
}

// CreateEvent creates a new calendar event
func (s *Service) CreateEvent(token *oauth2.Token, event CalendarEvent) error {
	ctx := context.Background()
	client := s.config.Client(ctx, token)

	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return fmt.Errorf("failed to create calendar service: %w", err)
	}

	calendarEvent := &calendar.Event{
		Summary:     event.Summary,
		Start:       &calendar.EventDateTime{DateTime: event.Start.Format(time.RFC3339)},
		End:         &calendar.EventDateTime{DateTime: event.End.Format(time.RFC3339)},
		Location:    event.Location,
		Description: event.Description,
	}

	_, err = srv.Events.Insert("primary", calendarEvent).Do()
	if err != nil {
		return fmt.Errorf("failed to create event: %w", err)
	}

	return nil
}

// ValidateToken checks if a token is valid and not expired
func (s *Service) ValidateToken(token *oauth2.Token) bool {
	if token == nil {
		return false
	}
	
	// Check if token is expired (with 5 minute buffer)
	return time.Now().Add(5 * time.Minute).Before(token.Expiry)
}

// TokenToInfo converts oauth2.Token to TokenInfo for storage
func (s *Service) TokenToInfo(token *oauth2.Token) TokenInfo {
	return TokenInfo{
		AccessToken:  token.AccessToken,
		RefreshToken: token.RefreshToken,
		Expiry:      token.Expiry,
		TokenType:   token.TokenType,
	}
}

// InfoToToken converts TokenInfo back to oauth2.Token
func (s *Service) InfoToToken(info TokenInfo) *oauth2.Token {
	return &oauth2.Token{
		AccessToken:  info.AccessToken,
		RefreshToken: info.RefreshToken,
		Expiry:      info.Expiry,
		TokenType:   info.TokenType,
	}
}