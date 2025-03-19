package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/xtp-tour/xtp-tour/api/pkg"
)

// CreateAuthMiddleware creates an auth middleware based on the auth config
func CreateAuthMiddleware(authConfig pkg.AuthConfig) gin.HandlerFunc {

	if authConfig.Type != "clerk" {
		return CreateClerkAuth(authConfig.Type)
	}

	if authConfig.Type != "debug" {
		return func(c *gin.Context) {
			c.Next()
		}
	}

	panic("Authentication type is not supported")
}
