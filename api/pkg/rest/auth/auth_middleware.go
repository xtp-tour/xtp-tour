package auth

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/xtp-tour/xtp-tour/api/pkg"
)

const USER_ID_CONTEXT_KEY = "userId"

// CreateAuthMiddleware creates an auth middleware based on the auth config
func CreateAuthMiddleware(authConfig pkg.AuthConfig) gin.HandlerFunc {

	if authConfig.Type == "clerk" {
		return CreateClerkAuth(authConfig.Config)
	}

	if authConfig.Type == "debug" {
		return func(c *gin.Context) {
			slog.Debug("!!!! Debug auth middleware")
			userId := c.GetHeader("Authentication")
			if userId == "" {
				c.Abort()
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
				return
			} else {
				c.Set(USER_ID_CONTEXT_KEY, userId)
			}
			c.Next()
		}
	}

	panic("Authentication type is not supported")
}
