package auth

import (
	"log/slog"
	"net/http"
	"strings"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwks"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/gin-gonic/gin"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest"
)

type JWKStore interface {
	GetJWK() *clerk.JSONWebKey
	SetJWK(*clerk.JSONWebKey)
}

type jwkStore struct {
	jwk *clerk.JSONWebKey
}

func (j *jwkStore) GetJWK() *clerk.JSONWebKey {
	return j.jwk
}

func (j *jwkStore) SetJWK(jwk *clerk.JSONWebKey) {
	j.jwk = jwk
}

func NewJWKStore() JWKStore {
	return &jwkStore{}
}

func CreateClerkAuthMiddleware(clerkConfig string) func(c *gin.Context) {

	config := &clerk.ClientConfig{}

	config.Key = clerk.String(clerkConfig)
	jwksClient := jwks.NewClient(config)
	userClient := user.NewClient(config)

	jwkStore := NewJWKStore()

	return func(c *gin.Context) {
		sessionToken := strings.TrimPrefix(c.Request.Header.Get("Authorization"), "Bearer ")

		// Attempt to get the JSON Web Key from your store.
		jwk := jwkStore.GetJWK()
		if jwk == nil {
			// Decode the session JWT so that we can find the key ID.
			unsafeClaims, err := jwt.Decode(c.Request.Context(), &jwt.DecodeParams{
				Token: sessionToken,
			})
			if err != nil {
				slog.Error("Error decoding JWT", "error", err)
				c.AbortWithStatusJSON(http.StatusForbidden, rest.ErrorResponse{Error: "Unauthorized"})
				return
			}

			// Fetch the JSON Web Key
			jwk, err = jwt.GetJSONWebKey(c.Request.Context(), &jwt.GetJSONWebKeyParams{
				KeyID:      unsafeClaims.KeyID,
				JWKSClient: jwksClient,
			})
			if err != nil {
				slog.Error("Error fetching JWK", "error", err)
				c.AbortWithStatusJSON(http.StatusInternalServerError, rest.ErrorResponse{Error: "Error fetching JWK"})
				return
			}
		}
		// Write the JSON Web Key to your store, so that next time
		// you can use the cached value.
		jwkStore.SetJWK(jwk)

		// Verify the session
		claims, err := jwt.Verify(c.Request.Context(), &jwt.VerifyParams{
			Token: sessionToken,
			JWK:   jwk,
			// 2 seconds leeway to account for clock skew
			Leeway: 2 * time.Second,
		})
		if err != nil {
			slog.Error("Error verifying JWT", "error", err)
			c.AbortWithStatusJSON(http.StatusForbidden, rest.ErrorResponse{Error: "Unauthorized"})
			return
		}

		usr, err := userClient.Get(c.Request.Context(), claims.Subject)
		if err != nil {
			slog.Error("Error getting user", "error", err)
			c.AbortWithStatusJSON(http.StatusForbidden, rest.ErrorResponse{Error: "Unauthorized"})
			return
		}
		c.Set("user", usr)
		c.Set(USER_ID_CONTEXT_KEY, usr.ID)
		c.Request.Context()

		c.Next()
	}
}
