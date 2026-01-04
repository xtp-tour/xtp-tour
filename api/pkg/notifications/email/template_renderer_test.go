package email

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const testDomainName = "https://xtp-tour.com"

func TestNewTemplateRenderer(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)
	assert.NotNil(t, renderer)
	assert.Equal(t, testDomainName, renderer.domainName)
}

func TestRenderEventConfirmed_AsHost(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := EventConfirmedData{
		RecipientName:    "John Host",
		IsHost:           true,
		HostName:         "John Host",
		DateTime:         "Saturday, Jan 15 at 10:00 AM",
		Location:         "Tennis Club Central",
		ConfirmedPlayers: []string{"Alice", "Bob"},
		EventURL:         "https://xtp-tour.com/events/123",
	}

	result, err := renderer.RenderEventConfirmed(data)
	require.NoError(t, err)
	assert.NotNil(t, result)

	// Check subject
	assert.Equal(t, "🎾 Your training session is confirmed!", result.Subject)

	// Check HTML content
	assert.Contains(t, result.HTMLBody, "John Host")
	assert.Contains(t, result.HTMLBody, "Saturday, Jan 15 at 10:00 AM")
	assert.Contains(t, result.HTMLBody, "Tennis Club Central")
	assert.Contains(t, result.HTMLBody, "Alice")
	assert.Contains(t, result.HTMLBody, "Bob")
	assert.Contains(t, result.HTMLBody, testDomainName+"/logo.png")
	assert.Contains(t, result.HTMLBody, "https://xtp-tour.com/events/123")
	assert.Contains(t, result.HTMLBody, "Session Confirmed")

	// Check plain text content
	assert.Contains(t, result.PlainBody, "John Host")
	assert.Contains(t, result.PlainBody, "Saturday, Jan 15 at 10:00 AM")
	assert.Contains(t, result.PlainBody, "Tennis Club Central")
	assert.Contains(t, result.PlainBody, "Alice")
	assert.Contains(t, result.PlainBody, "Bob")
}

func TestRenderEventConfirmed_AsParticipant(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := EventConfirmedData{
		RecipientName:    "Alice Player",
		IsHost:           false,
		HostName:         "John Host",
		DateTime:         "Sunday, Jan 16 at 2:00 PM",
		Location:         "City Sports Center",
		ConfirmedPlayers: []string{"Alice Player", "Bob"},
	}

	result, err := renderer.RenderEventConfirmed(data)
	require.NoError(t, err)
	assert.NotNil(t, result)

	// Check HTML content for participant view
	assert.Contains(t, result.HTMLBody, "Alice Player")
	assert.Contains(t, result.HTMLBody, "John Host")
	assert.Contains(t, result.HTMLBody, "confirmed your join request")

	// Check plain text content
	assert.Contains(t, result.PlainBody, "Alice Player")
	assert.Contains(t, result.PlainBody, "John Host")
}

func TestRenderEventConfirmed_DefaultEventURL(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := EventConfirmedData{
		RecipientName: "John",
		IsHost:        true,
		DateTime:      "Monday",
		Location:      "Court 1",
		EventURL:      "", // Empty - should default to domain
	}

	result, err := renderer.RenderEventConfirmed(data)
	require.NoError(t, err)

	// Should use domain name as default URL
	assert.Contains(t, result.HTMLBody, testDomainName)
}

func TestRenderUserJoined_WithComment(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := UserJoinedData{
		HostName:    "John Host",
		JoiningUser: "Alice Newcomer",
		Comment:     "Looking forward to playing tennis!",
		EventURL:    "https://xtp-tour.com/events/456",
	}

	result, err := renderer.RenderUserJoined(data)
	require.NoError(t, err)
	assert.NotNil(t, result)

	// Check subject
	assert.Equal(t, "🎾 New join request for your event", result.Subject)

	// Check HTML content
	assert.Contains(t, result.HTMLBody, "John Host")
	assert.Contains(t, result.HTMLBody, "Alice Newcomer")
	assert.Contains(t, result.HTMLBody, "Looking forward to playing tennis!")
	assert.Contains(t, result.HTMLBody, "https://xtp-tour.com/events/456")
	assert.Contains(t, result.HTMLBody, "New Join Request")
	assert.Contains(t, result.HTMLBody, testDomainName+"/logo.png")

	// Check plain text content
	assert.Contains(t, result.PlainBody, "John Host")
	assert.Contains(t, result.PlainBody, "Alice Newcomer")
	assert.Contains(t, result.PlainBody, "Looking forward to playing tennis!")
}

func TestRenderUserJoined_WithoutComment(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := UserJoinedData{
		HostName:    "Bob Host",
		JoiningUser: "Charlie Player",
		Comment:     "", // No comment
	}

	result, err := renderer.RenderUserJoined(data)
	require.NoError(t, err)
	assert.NotNil(t, result)

	// Check HTML content - should not contain comment section elements
	assert.Contains(t, result.HTMLBody, "Bob Host")
	assert.Contains(t, result.HTMLBody, "Charlie Player")
	// The comment section should not be rendered when comment is empty
	assert.NotContains(t, result.HTMLBody, "Message from Charlie Player")

	// Check plain text
	assert.Contains(t, result.PlainBody, "Bob Host")
	assert.Contains(t, result.PlainBody, "Charlie Player")
}

func TestRenderUserJoined_DefaultEventURL(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := UserJoinedData{
		HostName:    "Host",
		JoiningUser: "Player",
		EventURL:    "", // Empty - should default to domain
	}

	result, err := renderer.RenderUserJoined(data)
	require.NoError(t, err)

	// Should use domain name as default URL
	assert.Contains(t, result.HTMLBody, testDomainName)
}

func TestRenderEventExpired(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := EventExpiredData{
		RecipientName:  "John",
		CreateEventURL: "https://xtp-tour.com/events/new",
	}

	result, err := renderer.RenderEventExpired(data)
	require.NoError(t, err)
	assert.NotNil(t, result)

	// Check subject
	assert.Equal(t, "🎾 Your event has expired", result.Subject)

	// Check HTML content
	assert.Contains(t, result.HTMLBody, "John")
	assert.Contains(t, result.HTMLBody, "expired")
	assert.Contains(t, result.HTMLBody, "https://xtp-tour.com/events/new")
	assert.Contains(t, result.HTMLBody, "Create New Event")
	assert.Contains(t, result.HTMLBody, testDomainName+"/logo.png")

	// Check plain text content
	assert.Contains(t, result.PlainBody, "John")
	assert.Contains(t, result.PlainBody, "expired")
	assert.Contains(t, result.PlainBody, "https://xtp-tour.com/events/new")
}

func TestRenderEventExpired_DefaultCreateEventURL(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := EventExpiredData{
		RecipientName:  "User",
		CreateEventURL: "", // Empty - should default to domain/events/new
	}

	result, err := renderer.RenderEventExpired(data)
	require.NoError(t, err)

	// Should use domain + /events/new as default
	assert.Contains(t, result.HTMLBody, testDomainName+"/events/new")
}

func TestRenderEventExpired_WithoutRecipientName(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := EventExpiredData{
		RecipientName: "", // No recipient name
	}

	result, err := renderer.RenderEventExpired(data)
	require.NoError(t, err)

	// Should still render without recipient name
	assert.Contains(t, result.HTMLBody, "expired")
	assert.Contains(t, result.PlainBody, "expired")
}

func TestTemplateRenderer_HTMLStructure(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := EventConfirmedData{
		RecipientName: "Test User",
		IsHost:        true,
		DateTime:      "Test Date",
		Location:      "Test Location",
	}

	result, err := renderer.RenderEventConfirmed(data)
	require.NoError(t, err)

	// Verify HTML structure
	assert.Contains(t, result.HTMLBody, "<!DOCTYPE html>")
	assert.Contains(t, result.HTMLBody, "<html")
	assert.Contains(t, result.HTMLBody, "</html>")
	assert.Contains(t, result.HTMLBody, "<head>")
	assert.Contains(t, result.HTMLBody, "<body")

	// Verify brand colors are present
	assert.Contains(t, result.HTMLBody, "#1B365D") // Primary navy color
}

func TestTemplateRenderer_PlainTextStructure(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	data := UserJoinedData{
		HostName:    "Host",
		JoiningUser: "Player",
	}

	result, err := renderer.RenderUserJoined(data)
	require.NoError(t, err)

	// Verify plain text has no HTML tags
	assert.NotContains(t, result.PlainBody, "<html")
	assert.NotContains(t, result.PlainBody, "<div")
	assert.NotContains(t, result.PlainBody, "<table")

	// Verify it contains the app URL
	assert.Contains(t, result.PlainBody, testDomainName)
}

func TestTemplateRenderer_AllTemplatesHaveBothFormats(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	tests := []struct {
		name   string
		render func() (*RenderedEmail, error)
	}{
		{
			name: "EventConfirmed",
			render: func() (*RenderedEmail, error) {
				return renderer.RenderEventConfirmed(EventConfirmedData{
					RecipientName: "Test",
					DateTime:      "Test",
					Location:      "Test",
				})
			},
		},
		{
			name: "UserJoined",
			render: func() (*RenderedEmail, error) {
				return renderer.RenderUserJoined(UserJoinedData{
					HostName:    "Test",
					JoiningUser: "Test",
				})
			},
		},
		{
			name: "EventExpired",
			render: func() (*RenderedEmail, error) {
				return renderer.RenderEventExpired(EventExpiredData{})
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := tt.render()
			require.NoError(t, err)

			// Both HTML and plain text should be non-empty
			assert.NotEmpty(t, result.HTMLBody, "HTML body should not be empty")
			assert.NotEmpty(t, result.PlainBody, "Plain text body should not be empty")
			assert.NotEmpty(t, result.Subject, "Subject should not be empty")

			// HTML should contain HTML elements
			assert.True(t, strings.Contains(result.HTMLBody, "<") && strings.Contains(result.HTMLBody, ">"),
				"HTML body should contain HTML tags")

			// Plain text should not contain HTML
			assert.False(t, strings.Contains(result.PlainBody, "<html"),
				"Plain text should not contain HTML tags")
		})
	}
}

func TestTemplateRenderer_LogoURLGeneration(t *testing.T) {
	domains := []string{
		"https://xtp-tour.com",
		"https://app.xtp-tour.com",
		"http://localhost:3000",
	}

	for _, domain := range domains {
		t.Run(domain, func(t *testing.T) {
			renderer, err := NewTemplateRenderer(domain)
			require.NoError(t, err)

			result, err := renderer.RenderEventExpired(EventExpiredData{})
			require.NoError(t, err)

			expectedLogoURL := domain + "/logo.png"
			assert.Contains(t, result.HTMLBody, expectedLogoURL)
		})
	}
}

func TestTemplateRenderer_EventIdToURLConstruction(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	t.Run("EventConfirmed_WithEventId", func(t *testing.T) {
		result, err := renderer.RenderEventConfirmed(EventConfirmedData{
			RecipientName: "Test",
			DateTime:      "Monday",
			Location:      "Court",
			EventId:       "abc-123",
		})
		require.NoError(t, err)
		assert.Contains(t, result.HTMLBody, "https://xtp-tour.com/events/abc-123")
	})

	t.Run("UserJoined_WithEventId", func(t *testing.T) {
		result, err := renderer.RenderUserJoined(UserJoinedData{
			HostName:    "Host",
			JoiningUser: "Player",
			EventId:     "def-456",
		})
		require.NoError(t, err)
		assert.Contains(t, result.HTMLBody, "https://xtp-tour.com/events/def-456")
	})

	t.Run("EventConfirmed_WithoutEventId_FallbackToDomain", func(t *testing.T) {
		result, err := renderer.RenderEventConfirmed(EventConfirmedData{
			RecipientName: "Test",
			DateTime:      "Monday",
			Location:      "Court",
			EventId:       "", // No EventId
		})
		require.NoError(t, err)
		// Should fall back to domain without /events/
		assert.Contains(t, result.HTMLBody, testDomainName)
	})
}

func TestTemplateRenderer_PreviewText(t *testing.T) {
	renderer, err := NewTemplateRenderer(testDomainName)
	require.NoError(t, err)

	t.Run("EventConfirmed_Host", func(t *testing.T) {
		result, err := renderer.RenderEventConfirmed(EventConfirmedData{
			IsHost:   true,
			DateTime: "Monday at 10am",
			Location: "Court 1",
		})
		require.NoError(t, err)
		// HTML escapes apostrophe to &#39;
		assert.Contains(t, result.HTMLBody, "You&#39;ve confirmed a session on Monday at 10am at Court 1")
	})

	t.Run("EventConfirmed_Participant", func(t *testing.T) {
		result, err := renderer.RenderEventConfirmed(EventConfirmedData{
			IsHost:   false,
			HostName: "John",
			DateTime: "Tuesday",
			Location: "Court 2",
		})
		require.NoError(t, err)
		assert.Contains(t, result.HTMLBody, "John confirmed your join request for Tuesday at Court 2")
	})

	t.Run("UserJoined", func(t *testing.T) {
		result, err := renderer.RenderUserJoined(UserJoinedData{
			JoiningUser: "Alice",
		})
		require.NoError(t, err)
		assert.Contains(t, result.HTMLBody, "Alice wants to join your event")
	})

	t.Run("EventExpired", func(t *testing.T) {
		result, err := renderer.RenderEventExpired(EventExpiredData{})
		require.NoError(t, err)
		assert.Contains(t, result.HTMLBody, "Your event expired without any participants joining")
	})
}

