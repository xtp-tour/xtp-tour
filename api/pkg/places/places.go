package places

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
)

const (
	searchURL  = "https://places.googleapis.com/v1/places:searchText"
	maxResults = 10
)

type PlaceResult struct {
	PlaceID        string
	Name           string
	Address        string
	Latitude       float64
	Longitude      float64
	GoogleMapsLink string
	Website        string
}

type Service struct {
	apiKey string
	client *http.Client
}

func NewService(apiKey string) *Service {
	return &Service{
		apiKey: apiKey,
		client: &http.Client{},
	}
}

func (s *Service) IsConfigured() bool {
	return s.apiKey != ""
}

type searchTextRequest struct {
	TextQuery      string        `json:"textQuery"`
	IncludedType   string        `json:"includedType,omitempty"`
	LocationBias   *locationBias `json:"locationBias,omitempty"`
	MaxResultCount int           `json:"maxResultCount,omitempty"`
}

type locationBias struct {
	Circle *circle `json:"circle,omitempty"`
}

type circle struct {
	Center *latLng `json:"center"`
	Radius float64 `json:"radius"`
}

type latLng struct {
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
}

type searchTextResponse struct {
	Places []placeResponse `json:"places"`
}

type placeResponse struct {
	ID               string       `json:"id"`
	DisplayName      *displayName `json:"displayName"`
	FormattedAddress string       `json:"formattedAddress"`
	Location         *latLng      `json:"location"`
	GoogleMapsURI    string       `json:"googleMapsUri"`
	WebsiteURI       string       `json:"websiteUri"`
}

type displayName struct {
	Text string `json:"text"`
}

// SearchPlaces searches for sports facilities near the given coordinates
func (s *Service) SearchPlaces(ctx context.Context, query string, lat, lng float64) ([]PlaceResult, error) {
	logCtx := slog.With("method", "SearchPlaces", "query", query, "lat", lat, "lng", lng)

	if !s.IsConfigured() {
		return nil, fmt.Errorf("Google Places API key not configured")
	}

	reqBody := searchTextRequest{
		TextQuery:      query,
		IncludedType:   "sports_complex",
		MaxResultCount: maxResults,
	}

	if lat != 0 || lng != 0 {
		reqBody.LocationBias = &locationBias{
			Circle: &circle{
				Center: &latLng{Latitude: lat, Longitude: lng},
				Radius: 50000, // 50km radius
			},
		}
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, searchURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Goog-Api-Key", s.apiKey)
	req.Header.Set("X-Goog-FieldMask", "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.websiteUri")

	resp, err := s.client.Do(req)
	if err != nil {
		logCtx.Error("Failed to call Google Places API", "error", err)
		return nil, fmt.Errorf("failed to call Google Places API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logCtx.Error("Google Places API error", "status", resp.StatusCode, "body", string(body))
		return nil, fmt.Errorf("Google Places API returned status %d", resp.StatusCode)
	}

	var searchResp searchTextResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	results := make([]PlaceResult, 0, len(searchResp.Places))
	for _, p := range searchResp.Places {
		results = append(results, toPlaceResult(p))
	}

	logCtx.Info("Places search completed", "resultCount", len(results))
	return results, nil
}

// GetPlaceDetails fetches details for a specific place by its ID
func (s *Service) GetPlaceDetails(ctx context.Context, placeID string) (*PlaceResult, error) {
	logCtx := slog.With("method", "GetPlaceDetails", "placeID", placeID)

	if !s.IsConfigured() {
		return nil, fmt.Errorf("Google Places API key not configured")
	}

	url := fmt.Sprintf("https://places.googleapis.com/v1/places/%s", placeID)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("X-Goog-Api-Key", s.apiKey)
	req.Header.Set("X-Goog-FieldMask", "id,displayName,formattedAddress,location,googleMapsUri,websiteUri")

	resp, err := s.client.Do(req)
	if err != nil {
		logCtx.Error("Failed to call Google Places API", "error", err)
		return nil, fmt.Errorf("failed to call Google Places API: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		logCtx.Error("Google Places API error", "status", resp.StatusCode, "body", string(body))
		return nil, fmt.Errorf("Google Places API returned status %d", resp.StatusCode)
	}

	var p placeResponse
	if err := json.NewDecoder(resp.Body).Decode(&p); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	result := toPlaceResult(p)
	return &result, nil
}

func toPlaceResult(p placeResponse) PlaceResult {
	result := PlaceResult{
		PlaceID:        p.ID,
		Address:        p.FormattedAddress,
		GoogleMapsLink: p.GoogleMapsURI,
		Website:        p.WebsiteURI,
	}
	if p.DisplayName != nil {
		result.Name = p.DisplayName.Text
	}
	if p.Location != nil {
		result.Latitude = p.Location.Latitude
		result.Longitude = p.Location.Longitude
	}
	return result
}
