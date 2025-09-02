package db

import (
	"database/sql"
	"time"

	"github.com/xtp-tour/xtp-tour/api/pkg/googlecalendar"
)

// GoogleCalendarConnection represents a user's Google Calendar connection
type GoogleCalendarConnection struct {
	ID           string    `db:"id"`
	UserID       string    `db:"user_id"`
	AccessToken  string    `db:"access_token"`
	RefreshToken string    `db:"refresh_token"`
	TokenExpiry  time.Time `db:"token_expiry"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

// GoogleCalendarRepository handles database operations for Google Calendar connections
type GoogleCalendarRepository struct {
	db *sql.DB
}

// NewGoogleCalendarRepository creates a new repository
func NewGoogleCalendarRepository(db *sql.DB) *GoogleCalendarRepository {
	return &GoogleCalendarRepository{db: db}
}

// CreateConnection stores a new Google Calendar connection
func (r *GoogleCalendarRepository) CreateConnection(conn *GoogleCalendarConnection) error {
	query := `
		INSERT INTO google_calendar_connections 
		(id, user_id, access_token, refresh_token, token_expiry, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	
	_, err := r.db.Exec(query,
		conn.ID,
		conn.UserID,
		conn.AccessToken,
		conn.RefreshToken,
		conn.TokenExpiry,
		conn.CreatedAt,
		conn.UpdatedAt,
	)
	
	return err
}

// GetConnectionByUserID retrieves a user's Google Calendar connection
func (r *GoogleCalendarRepository) GetConnectionByUserID(userID string) (*GoogleCalendarConnection, error) {
	query := `
		SELECT id, user_id, access_token, refresh_token, token_expiry, created_at, updated_at
		FROM google_calendar_connections
		WHERE user_id = ?
	`
	
	var conn GoogleCalendarConnection
	err := r.db.QueryRow(query, userID).Scan(
		&conn.ID,
		&conn.UserID,
		&conn.AccessToken,
		&conn.RefreshToken,
		&conn.TokenExpiry,
		&conn.CreatedAt,
		&conn.UpdatedAt,
	)
	
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	
	return &conn, nil
}

// UpdateConnection updates an existing Google Calendar connection
func (r *GoogleCalendarRepository) UpdateConnection(conn *GoogleCalendarConnection) error {
	query := `
		UPDATE google_calendar_connections
		SET access_token = ?, refresh_token = ?, token_expiry = ?, updated_at = ?
		WHERE user_id = ?
	`
	
	_, err := r.db.Exec(query,
		conn.AccessToken,
		conn.RefreshToken,
		conn.TokenExpiry,
		time.Now(),
		conn.UserID,
	)
	
	return err
}

// DeleteConnection removes a user's Google Calendar connection
func (r *GoogleCalendarRepository) DeleteConnection(userID string) error {
	query := `DELETE FROM google_calendar_connections WHERE user_id = ?`
	_, err := r.db.Exec(query, userID)
	return err
}

// HasConnection checks if a user has a Google Calendar connection
func (r *GoogleCalendarRepository) HasConnection(userID string) (bool, error) {
	query := `SELECT COUNT(*) FROM google_calendar_connections WHERE user_id = ?`
	
	var count int
	err := r.db.QueryRow(query, userID).Scan(&count)
	if err != nil {
		return false, err
	}
	
	return count > 0, nil
}

// GetValidToken retrieves a valid token for a user, refreshing if necessary
func (r *GoogleCalendarRepository) GetValidToken(userID string, service *googlecalendar.Service) (*googlecalendar.TokenInfo, error) {
	conn, err := r.GetConnectionByUserID(userID)
	if err != nil {
		return nil, err
	}
	
	if conn == nil {
		return nil, nil
	}
	
	// Convert stored token to oauth2.Token
	token := service.InfoToToken(googlecalendar.TokenInfo{
		AccessToken:  conn.AccessToken,
		RefreshToken: conn.RefreshToken,
		Expiry:      conn.TokenExpiry,
		TokenType:   "Bearer",
	})
	
	// Check if token is valid
	if service.ValidateToken(token) {
		return &googlecalendar.TokenInfo{
			AccessToken:  token.AccessToken,
			RefreshToken: token.RefreshToken,
			Expiry:      token.Expiry,
			TokenType:   token.TokenType,
		}, nil
	}
	
	// Token is expired, refresh it
	newToken, err := service.RefreshToken(conn.RefreshToken)
	if err != nil {
		return nil, err
	}
	
	// Update stored token
	newTokenInfo := service.TokenToInfo(newToken)
	conn.AccessToken = newTokenInfo.AccessToken
	conn.TokenExpiry = newTokenInfo.Expiry
	conn.UpdatedAt = time.Now()
	
	err = r.UpdateConnection(conn)
	if err != nil {
		return nil, err
	}
	
	return &newTokenInfo, nil
}