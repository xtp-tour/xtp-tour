package calendar

import (
	"context"
	"errors"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/xtp-tour/xtp-tour/api/pkg/crypto"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
)

// MockDb is a mock implementation of the database interface
type MockDb struct {
	mock.Mock
}

func (m *MockDb) UpsertCalendarConnection(ctx context.Context, connection *db.UserCalendarConnectionRow) error {
	args := m.Called(ctx, connection)
	return args.Error(0)
}

func (m *MockDb) GetCalendarConnection(ctx context.Context, userID, provider string) (*db.UserCalendarConnectionRow, error) {
	args := m.Called(ctx, userID, provider)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*db.UserCalendarConnectionRow), args.Error(1)
}

func (m *MockDb) UpdateCalendarConnectionTokens(ctx context.Context, connection *db.UserCalendarConnectionRow) error {
	args := m.Called(ctx, connection)
	return args.Error(0)
}

func (m *MockDb) DeactivateCalendarConnection(ctx context.Context, userID, provider string) error {
	args := m.Called(ctx, userID, provider)
	return args.Error(0)
}

func (m *MockDb) UpsertCalendarPreferences(ctx context.Context, prefs *db.UserCalendarPreferencesRow) error {
	args := m.Called(ctx, prefs)
	return args.Error(0)
}

func (m *MockDb) GetCalendarPreferences(ctx context.Context, userID string) (*db.UserCalendarPreferencesRow, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*db.UserCalendarPreferencesRow), args.Error(1)
}

func (m *MockDb) ClearCachedBusyTimes(ctx context.Context, userID string) error {
	args := m.Called(ctx, userID)
	return args.Error(0)
}

func (m *MockDb) InsertBusyTime(ctx context.Context, busyTime *db.CalendarBusyTimeRow) error {
	args := m.Called(ctx, busyTime)
	return args.Error(0)
}

func setupTestService(t *testing.T) (*Service, *MockDb) {
	// Set up test encryption key
	os.Setenv("TOKEN_ENCRYPTION_KEY", "dGVzdGtleTEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIzNDU=") // base64 encoded 32-byte key

	mockDb := &MockDb{}

	authConfig := AuthConfig{
		ClientID:     "test-client-id",
		ClientSecret: "test-client-secret",
		RedirectURL:  "http://localhost:8080/callback",
		Scopes:       GetDefaultScopes(),
	}

	// Create a simplified service for testing without OAuth2 dependencies
	service := &Service{
		db:         mockDb,
		encryption: crypto.MustInitTokenEncryption(),
	}

	return service, mockDb
}

func TestGenerateStateParameter(t *testing.T) {
	service, _ := setupTestService(t)

	userID := "test-user-123"
	state := service.generateStateParameter(userID)

	// Should contain user ID and random part
	assert.Contains(t, state, userID)
	assert.Contains(t, state, ":")

	// Should generate different states each time
	state2 := service.generateStateParameter(userID)
	assert.NotEqual(t, state, state2)
}

func TestValidateStateParameter(t *testing.T) {
	service, _ := setupTestService(t)

	tests := []struct {
		name           string
		state          string
		expectedUserID string
		expectError    bool
	}{
		{
			name:           "valid state",
			state:          "user123:randomstring",
			expectedUserID: "user123",
			expectError:    false,
		},
		{
			name:           "empty state",
			state:          "",
			expectedUserID: "user123",
			expectError:    true,
		},
		{
			name:           "invalid format",
			state:          "invalidformat",
			expectedUserID: "user123",
			expectError:    true,
		},
		{
			name:           "user ID mismatch",
			state:          "different-user:randomstring",
			expectedUserID: "user123",
			expectError:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.validateStateParameter(tt.state, tt.expectedUserID)
			if tt.expectError {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestHandleCallback_InvalidState(t *testing.T) {
	service, _ := setupTestService(t)

	userID := "test-user-123"
	code := "test-auth-code"
	invalidState := "invalid-state"

	// Test just the state validation part since we can't test OAuth without dependencies
	err := service.validateStateParameter(invalidState, userID)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid state parameter format")
}

func TestGetConnectionStatus_NotFound(t *testing.T) {
	service, mockDb := setupTestService(t)

	userID := "test-user-123"

	// Mock database call to return not found error
	mockDb.On("GetCalendarConnection", mock.Anything, userID, "google").Return(nil, db.DbObjectNotFoundError{})

	connection, err := service.GetConnectionStatus(context.Background(), userID)
	assert.NoError(t, err)
	assert.Nil(t, connection)
}

func TestGetConnectionStatus_Found(t *testing.T) {
	service, mockDb := setupTestService(t)

	userID := "test-user-123"
	now := time.Now()

	dbConnection := &db.UserCalendarConnectionRow{
		Id:           "conn-123",
		UserId:       userID,
		Provider:     "google",
		AccessToken:  "encrypted-access-token",
		RefreshToken: "encrypted-refresh-token",
		TokenExpiry:  now.Add(time.Hour),
		CalendarId:   "primary",
		IsActive:     true,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	mockDb.On("GetCalendarConnection", mock.Anything, userID, "google").Return(dbConnection, nil)

	connection, err := service.GetConnectionStatus(context.Background(), userID)
	assert.NoError(t, err)
	assert.NotNil(t, connection)
	assert.Equal(t, userID, connection.UserID)
	assert.Equal(t, "google", connection.Provider)
	assert.Equal(t, true, connection.IsActive)
}

func TestDisconnectCalendar(t *testing.T) {
	service, mockDb := setupTestService(t)

	userID := "test-user-123"

	mockDb.On("DeactivateCalendarConnection", mock.Anything, userID, "google").Return(nil)

	err := service.DisconnectCalendar(context.Background(), userID)
	assert.NoError(t, err)

	mockDb.AssertExpectations(t)
}

func TestDisconnectCalendar_DatabaseError(t *testing.T) {
	service, mockDb := setupTestService(t)

	userID := "test-user-123"

	mockDb.On("DeactivateCalendarConnection", mock.Anything, userID, "google").Return(errors.New("database error"))

	err := service.DisconnectCalendar(context.Background(), userID)
	assert.Error(t, err)

	mockDb.AssertExpectations(t)
}

func TestGetDefaultScopes(t *testing.T) {
	scopes := GetDefaultScopes()

	assert.NotEmpty(t, scopes)
	assert.Contains(t, scopes, "https://www.googleapis.com/auth/calendar.readonly")
}

// Test token encryption/decryption functionality
func TestTokenEncryption(t *testing.T) {
	service, _ := setupTestService(t)

	originalToken := "test-access-token-12345"

	// Encrypt
	encrypted, err := service.encryption.EncryptToken(originalToken)
	assert.NoError(t, err)
	assert.NotEmpty(t, encrypted)
	assert.NotEqual(t, originalToken, encrypted)

	// Decrypt
	decrypted, err := service.encryption.DecryptToken(encrypted)
	assert.NoError(t, err)
	assert.Equal(t, originalToken, decrypted)
}

func TestTokenEncryption_EmptyToken(t *testing.T) {
	service, _ := setupTestService(t)

	// Test empty token
	encrypted, err := service.encryption.EncryptToken("")
	assert.NoError(t, err)
	assert.Equal(t, "", encrypted)

	decrypted, err := service.encryption.DecryptToken("")
	assert.NoError(t, err)
	assert.Equal(t, "", decrypted)
}

func TestTokenEncryption_InvalidCiphertext(t *testing.T) {
	service, _ := setupTestService(t)

	// Test invalid ciphertext
	_, err := service.encryption.DecryptToken("invalid-base64!")
	assert.Error(t, err)

	// Test short ciphertext
	_, err = service.encryption.DecryptToken("dGVzdA==") // "test" in base64, too short
	assert.Error(t, err)
}

func TestCacheBusyTimes(t *testing.T) {
	service, mockDb := setupTestService(t)

	userID := "test-user-123"
	busyPeriods := []BusyPeriod{
		{
			Start: time.Now(),
			End:   time.Now().Add(time.Hour),
			Title: "Meeting",
		},
		{
			Start: time.Now().Add(2 * time.Hour),
			End:   time.Now().Add(3 * time.Hour),
			Title: "Appointment",
		},
	}

	// Mock database calls
	mockDb.On("ClearCachedBusyTimes", mock.Anything, userID).Return(nil)
	mockDb.On("InsertBusyTime", mock.Anything, mock.AnythingOfType("*db.CalendarBusyTimeRow")).Return(nil).Times(2)

	err := service.cacheBusyTimes(context.Background(), userID, busyPeriods)
	assert.NoError(t, err)

	mockDb.AssertExpectations(t)
}

func TestCacheBusyTimes_ClearError(t *testing.T) {
	service, mockDb := setupTestService(t)

	userID := "test-user-123"
	busyPeriods := []BusyPeriod{}

	// Mock database error
	mockDb.On("ClearCachedBusyTimes", mock.Anything, userID).Return(errors.New("clear error"))

	err := service.cacheBusyTimes(context.Background(), userID, busyPeriods)
	assert.Error(t, err)

	mockDb.AssertExpectations(t)
}

func tearDown() {
	os.Unsetenv("TOKEN_ENCRYPTION_KEY")
}

func TestMain(m *testing.M) {
	code := m.Run()
	tearDown()
	os.Exit(code)
}
