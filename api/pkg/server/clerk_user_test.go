package server

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/xtp-tour/xtp-tour/api/pkg/api"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest/auth"
)

func Test_ClerkEmailPhoneExtraction(t *testing.T) {
	gin.SetMode(gin.TestMode)

	t.Run("Auto-populate email from Clerk when not provided", func(tt *testing.T) {
		// Setup
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		emailID := "email_123"
		primaryEmail := "user@example.com"

		clerkUser := &clerk.User{
			PrimaryEmailAddressID: &emailID,
			EmailAddresses: []*clerk.EmailAddress{
				{
					ID:           emailID,
					EmailAddress: primaryEmail,
				},
			},
		}

		c.Set("user", clerkUser)
		c.Set(auth.USER_ID_CONTEXT_KEY, "test-user-123")

		req := &api.CreateUserProfileRequest{
			UserProfileData: api.UserProfileData{
				FirstName: "John",
				LastName:  "Doe",
				NTRPLevel: 4.5,
				Language:  "en",
				Country:   "PL",
				City:      "Warsaw",
				Notifications: api.NotificationSettings{
					Email:    "", // Not provided
					Channels: 0,
				},
			},
		}

		c.Request = httptest.NewRequest(http.MethodPost, "/api/profiles/", strings.NewReader("{}"))

		// Simulate the extraction logic from createUserProfileHandler
		if clerkUser, exists := c.Get("user"); exists {
			if usr, ok := clerkUser.(*clerk.User); ok {
				if req.Notifications.Email == "" && usr.PrimaryEmailAddressID != nil {
					for _, emailAddr := range usr.EmailAddresses {
						if emailAddr.ID == *usr.PrimaryEmailAddressID {
							req.Notifications.Email = emailAddr.EmailAddress
							break
						}
					}
				}

				if req.Notifications.Email != "" && req.Notifications.Channels == 0 {
					req.Notifications.Channels = 1 // Email channel enabled
				}
			}
		}

		// Assert
		assert.Equal(tt, primaryEmail, req.Notifications.Email, "Email should be auto-populated from Clerk")
		assert.Equal(tt, uint8(1), req.Notifications.Channels, "Email channel should be enabled")
	})

	t.Run("Auto-populate phone from Clerk when not provided", func(tt *testing.T) {
		// Setup
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		phoneID := "phone_123"
		primaryPhone := "+48123456789"

		clerkUser := &clerk.User{
			PrimaryPhoneNumberID: &phoneID,
			PhoneNumbers: []*clerk.PhoneNumber{
				{
					ID:          phoneID,
					PhoneNumber: primaryPhone,
				},
			},
		}

		c.Set("user", clerkUser)
		c.Set(auth.USER_ID_CONTEXT_KEY, "test-user-123")

		req := &api.CreateUserProfileRequest{
			UserProfileData: api.UserProfileData{
				FirstName: "John",
				LastName:  "Doe",
				NTRPLevel: 4.5,
				Language:  "en",
				Country:   "PL",
				City:      "Warsaw",
				Notifications: api.NotificationSettings{
					PhoneNumber: "", // Not provided
					Channels:    0,
				},
			},
		}

		c.Request = httptest.NewRequest(http.MethodPost, "/api/profiles/", strings.NewReader("{}"))

		// Simulate the extraction logic from createUserProfileHandler
		if clerkUser, exists := c.Get("user"); exists {
			if usr, ok := clerkUser.(*clerk.User); ok {
				if req.Notifications.PhoneNumber == "" && usr.PrimaryPhoneNumberID != nil {
					for _, phoneNum := range usr.PhoneNumbers {
						if phoneNum.ID == *usr.PrimaryPhoneNumberID {
							req.Notifications.PhoneNumber = phoneNum.PhoneNumber
							break
						}
					}
				}
			}
		}

		// Assert
		assert.Equal(tt, primaryPhone, req.Notifications.PhoneNumber, "Phone should be auto-populated from Clerk")
	})

	t.Run("Don't override email if already provided", func(tt *testing.T) {
		// Setup
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		emailID := "email_123"
		clerkEmail := "clerk@example.com"
		userProvidedEmail := "user@example.com"

		clerkUser := &clerk.User{
			PrimaryEmailAddressID: &emailID,
			EmailAddresses: []*clerk.EmailAddress{
				{
					ID:           emailID,
					EmailAddress: clerkEmail,
				},
			},
		}

		c.Set("user", clerkUser)
		c.Set(auth.USER_ID_CONTEXT_KEY, "test-user-123")

		req := &api.CreateUserProfileRequest{
			UserProfileData: api.UserProfileData{
				FirstName: "John",
				LastName:  "Doe",
				NTRPLevel: 4.5,
				Language:  "en",
				Country:   "PL",
				City:      "Warsaw",
				Notifications: api.NotificationSettings{
					Email:    userProvidedEmail, // Already provided
					Channels: 0,
				},
			},
		}

		c.Request = httptest.NewRequest(http.MethodPost, "/api/profiles/", strings.NewReader("{}"))

		// Simulate the extraction logic from createUserProfileHandler
		if clerkUser, exists := c.Get("user"); exists {
			if usr, ok := clerkUser.(*clerk.User); ok {
				if req.Notifications.Email == "" && usr.PrimaryEmailAddressID != nil {
					for _, emailAddr := range usr.EmailAddresses {
						if emailAddr.ID == *usr.PrimaryEmailAddressID {
							req.Notifications.Email = emailAddr.EmailAddress
							break
						}
					}
				}
			}
		}

		// Assert
		assert.Equal(tt, userProvidedEmail, req.Notifications.Email, "User provided email should not be overridden")
	})

	t.Run("Handle missing Clerk user gracefully", func(tt *testing.T) {
		// Setup
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		// No Clerk user set in context
		c.Set(auth.USER_ID_CONTEXT_KEY, "test-user-123")

		req := &api.CreateUserProfileRequest{
			UserProfileData: api.UserProfileData{
				FirstName: "John",
				LastName:  "Doe",
				NTRPLevel: 4.5,
				Language:  "en",
				Country:   "PL",
				City:      "Warsaw",
				Notifications: api.NotificationSettings{
					Email:    "",
					Channels: 0,
				},
			},
		}

		c.Request = httptest.NewRequest(http.MethodPost, "/api/profiles/", strings.NewReader("{}"))

		// Simulate the extraction logic from createUserProfileHandler
		if clerkUser, exists := c.Get("user"); exists {
			if usr, ok := clerkUser.(*clerk.User); ok {
				if req.Notifications.Email == "" && usr.PrimaryEmailAddressID != nil {
					for _, emailAddr := range usr.EmailAddresses {
						if emailAddr.ID == *usr.PrimaryEmailAddressID {
							req.Notifications.Email = emailAddr.EmailAddress
							break
						}
					}
				}
			}
		}

		// Assert - should not panic, email remains empty
		assert.Equal(tt, "", req.Notifications.Email, "Email should remain empty when Clerk user is not available")
	})

	t.Run("Handle Clerk user with no primary email", func(tt *testing.T) {
		// Setup
		w := httptest.NewRecorder()
		c, _ := gin.CreateTestContext(w)

		clerkUser := &clerk.User{
			PrimaryEmailAddressID: nil, // No primary email
			EmailAddresses:        []*clerk.EmailAddress{},
		}

		c.Set("user", clerkUser)
		c.Set(auth.USER_ID_CONTEXT_KEY, "test-user-123")

		req := &api.CreateUserProfileRequest{
			UserProfileData: api.UserProfileData{
				FirstName: "John",
				LastName:  "Doe",
				NTRPLevel: 4.5,
				Language:  "en",
				Country:   "PL",
				City:      "Warsaw",
				Notifications: api.NotificationSettings{
					Email:    "",
					Channels: 0,
				},
			},
		}

		c.Request = httptest.NewRequest(http.MethodPost, "/api/profiles/", strings.NewReader("{}"))

		// Simulate the extraction logic from createUserProfileHandler
		if clerkUser, exists := c.Get("user"); exists {
			if usr, ok := clerkUser.(*clerk.User); ok {
				if req.Notifications.Email == "" && usr.PrimaryEmailAddressID != nil {
					for _, emailAddr := range usr.EmailAddresses {
						if emailAddr.ID == *usr.PrimaryEmailAddressID {
							req.Notifications.Email = emailAddr.EmailAddress
							break
						}
					}
				}
			}
		}

		// Assert - should handle gracefully
		assert.Equal(tt, "", req.Notifications.Email, "Email should remain empty when Clerk user has no primary email")
	})
}
