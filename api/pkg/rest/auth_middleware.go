package rest

import (
	"net/http"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/gin-gonic/gin"
)

func AuthMiddleware(authConfig AuthConfig) gin.HandlerFunc {

	if authConfig.Type == "clerk" {
		clerk.SetKey(authConfig.Config)
	} else {
		panic("Authentication type is not supported ")
	}

	return func(c *gin.Context) {

		claims, ok := clerk.SessionClaimsFromContext(c.Request.Context())
		if !ok || claims == nil {
			c.AbortWithStatus(http.StatusForbidden)
			return
		}
		c.Next()
	}
}
