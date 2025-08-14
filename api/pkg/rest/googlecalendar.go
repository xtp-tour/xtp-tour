package rest

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"github.com/xtp-tour/xtp-tour/api/pkg/googlecalendar"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest/auth"
)

// GoogleCalendarHandler handles Google Calendar REST operations
type GoogleCalendarHandler struct {
	service    *googlecalendar.Service
	repository *db.GoogleCalendarRepository
}

// NewGoogleCalendarHandler creates a new handler
func NewGoogleCalendarHandler(service *googlecalendar.Service, repository *db.GoogleCalendarRepository) *GoogleCalendarHandler {
	return &GoogleCalendarHandler{
		service:    service,
		repository: repository,
	}
}

// ConnectRequest represents a request to connect Google Calendar
type ConnectRequest struct {
	AuthCode string `json:"authCode" validate:"required"`
}

// ConnectResponse represents the response after connecting
type ConnectResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// DisconnectResponse represents the response after disconnecting
type DisconnectResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
}

// GetBlockedEventsRequest represents a request to get blocked events
type GetBlockedEventsRequest struct {
	StartDate string `query:"startDate" validate:"required"`
	EndDate   string `query:"endDate" validate:"required"`
}

// GetBlockedEventsResponse represents blocked events response
type GetBlockedEventsResponse struct {
	Events []googlecalendar.CalendarEvent `json:"events"`
}

// ConnectionStatusResponse represents the connection status
type ConnectionStatusResponse struct {
	Connected bool `json:"connected"`
}

// Connect handles Google Calendar connection
func (h *GoogleCalendarHandler) Connect(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req ConnectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Exchange auth code for tokens
	token, err := h.service.ExchangeCode(req.AuthCode)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid authorization code"})
		return
	}

	// Check if user already has a connection
	existingConn, err := h.repository.GetConnectionByUserID(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check existing connection"})
		return
	}

	// Convert token to info for storage
	tokenInfo := h.service.TokenToInfo(token)

	if existingConn != nil {
		// Update existing connection
		existingConn.AccessToken = tokenInfo.AccessToken
		existingConn.RefreshToken = tokenInfo.RefreshToken
		existingConn.TokenExpiry = tokenInfo.Expiry
		existingConn.UpdatedAt = time.Now()

		err = h.repository.UpdateConnection(existingConn)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update connection"})
			return
		}
	} else {
		// Create new connection
		conn := &db.GoogleCalendarConnection{
			ID:           uuid.New().String(),
			UserID:       userID,
			AccessToken:  tokenInfo.AccessToken,
			RefreshToken: tokenInfo.RefreshToken,
			TokenExpiry:  tokenInfo.Expiry,
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}

		err = h.repository.CreateConnection(conn)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create connection"})
			return
		}
	}

	c.JSON(http.StatusOK, ConnectResponse{
		Success: true,
		Message: "Google Calendar connected successfully",
	})
}

// Disconnect handles Google Calendar disconnection
func (h *GoogleCalendarHandler) Disconnect(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	err := h.repository.DeleteConnection(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to disconnect"})
		return
	}

	c.JSON(http.StatusOK, DisconnectResponse{
		Success: true,
		Message: "Google Calendar disconnected successfully",
	})
}

// GetConnectionStatus checks if user has Google Calendar connection
func (h *GoogleCalendarHandler) GetConnectionStatus(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	hasConnection, err := h.repository.HasConnection(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to check connection status"})
		return
	}

	c.JSON(http.StatusOK, ConnectionStatusResponse{
		Connected: hasConnection,
	})
}

// GetBlockedEvents retrieves blocked events from Google Calendar
func (h *GoogleCalendarHandler) GetBlockedEvents(c *gin.Context) {
	userID := auth.GetUserID(c)
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	var req GetBlockedEventsRequest
	if err := c.ShouldBindQuery(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	startDate, err := time.Parse(time.RFC3339, req.StartDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid startDate format"})
		return
	}

	endDate, err := time.Parse(time.RFC3339, req.EndDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid endDate format"})
		return
	}

	// Get valid token for user
	tokenInfo, err := h.repository.GetValidToken(userID, h.service)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to get valid token"})
		return
	}

	if tokenInfo == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "no Google Calendar connection found"})
		return
	}

	// Convert to oauth2.Token
	token := h.service.InfoToToken(*tokenInfo)

	// Fetch events from Google Calendar
	events, err := h.service.GetEvents(token, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch events"})
		return
	}

	c.JSON(http.StatusOK, GetBlockedEventsResponse{
		Events: events,
	})
}

// GetAuthURL generates the OAuth authorization URL
func (h *GoogleCalendarHandler) GetAuthURL(c *gin.Context) {
	authURL := h.service.GetAuthURL()
	c.JSON(http.StatusOK, gin.H{"authUrl": authURL})
}