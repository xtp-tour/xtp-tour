package email

import (
	"bytes"
	"embed"
	"fmt"
	htmltemplate "html/template"
	texttemplate "text/template"
)

//go:embed templates/*.html templates/*.txt
var templateFS embed.FS

// TemplateType identifies the type of email template
type TemplateType string

const (
	TemplateEventConfirmed TemplateType = "event_confirmed"
	TemplateUserJoined     TemplateType = "user_joined"
	TemplateEventExpired   TemplateType = "event_expired"
)

// BaseTemplateData contains common data for all email templates
type BaseTemplateData struct {
	LogoURL     string
	AppURL      string
	PreviewText string
}

// EventConfirmedData contains data for event confirmation emails
type EventConfirmedData struct {
	BaseTemplateData
	RecipientName    string
	IsHost           bool
	HostName         string
	DateTime         string
	Location         string
	ConfirmedPlayers []string
	EventId          string // Used to construct EventURL
	EventURL         string // Populated by renderer
}

// UserJoinedData contains data for join request notification emails
type UserJoinedData struct {
	BaseTemplateData
	HostName    string
	JoiningUser string
	Comment     string
	EventId     string // Used to construct EventURL
	EventURL    string // Populated by renderer
}

// EventExpiredData contains data for event expiration emails
type EventExpiredData struct {
	BaseTemplateData
	RecipientName  string
	EventId        string // Used to construct CreateEventURL
	CreateEventURL string // Populated by renderer
}

// TemplateRenderer handles email template rendering
type TemplateRenderer struct {
	htmlTemplates *htmltemplate.Template
	textTemplates *texttemplate.Template
	domainName    string
}

// NewTemplateRenderer creates a new template renderer
func NewTemplateRenderer(domainName string) (*TemplateRenderer, error) {
	// Parse HTML templates
	htmlTmpl, err := htmltemplate.New("").ParseFS(templateFS, "templates/*.html")
	if err != nil {
		return nil, fmt.Errorf("failed to parse HTML templates: %w", err)
	}

	// Parse text templates
	textTmpl, err := texttemplate.New("").ParseFS(templateFS, "templates/*.txt")
	if err != nil {
		return nil, fmt.Errorf("failed to parse text templates: %w", err)
	}

	return &TemplateRenderer{
		htmlTemplates: htmlTmpl,
		textTemplates: textTmpl,
		domainName:    domainName,
	}, nil
}

// RenderedEmail contains both HTML and plain text versions of an email
type RenderedEmail struct {
	Subject   string
	HTMLBody  string
	PlainBody string
}

// RenderEventConfirmed renders the event confirmation email
func (r *TemplateRenderer) RenderEventConfirmed(data EventConfirmedData) (*RenderedEmail, error) {
	data.LogoURL = r.domainName + "/logo.png"
	data.AppURL = r.domainName

	// Construct EventURL from EventId if not already set
	if data.EventURL == "" {
		if data.EventId != "" {
			data.EventURL = r.domainName + "/events/" + data.EventId
		} else {
			data.EventURL = r.domainName
		}
	}

	subject := "🎾 Your training session is confirmed!"
	if data.IsHost {
		data.PreviewText = fmt.Sprintf("You've confirmed a session on %s at %s", data.DateTime, data.Location)
	} else {
		data.PreviewText = fmt.Sprintf("%s confirmed your join request for %s at %s", data.HostName, data.DateTime, data.Location)
	}

	return r.render(TemplateEventConfirmed, subject, data)
}

// RenderUserJoined renders the join request notification email
func (r *TemplateRenderer) RenderUserJoined(data UserJoinedData) (*RenderedEmail, error) {
	data.LogoURL = r.domainName + "/logo.png"
	data.AppURL = r.domainName

	// Construct EventURL from EventId if not already set
	if data.EventURL == "" {
		if data.EventId != "" {
			data.EventURL = r.domainName + "/events/" + data.EventId
		} else {
			data.EventURL = r.domainName
		}
	}

	subject := "🎾 New join request for your event"
	data.PreviewText = fmt.Sprintf("%s wants to join your event", data.JoiningUser)

	return r.render(TemplateUserJoined, subject, data)
}

// RenderEventExpired renders the event expiration email
func (r *TemplateRenderer) RenderEventExpired(data EventExpiredData) (*RenderedEmail, error) {
	data.LogoURL = r.domainName + "/logo.png"
	data.AppURL = r.domainName

	// CreateEventURL is always the same - create new event page
	if data.CreateEventURL == "" {
		data.CreateEventURL = r.domainName + "/events/new"
	}

	subject := "🎾 Your event has expired"
	data.PreviewText = "Your event expired without any participants joining"

	return r.render(TemplateEventExpired, subject, data)
}

// render executes both HTML and text templates for a given template type
func (r *TemplateRenderer) render(tmplType TemplateType, subject string, data interface{}) (*RenderedEmail, error) {
	htmlName := string(tmplType) + ".html"
	textName := string(tmplType) + ".txt"

	// Render HTML
	var htmlBuf bytes.Buffer
	if err := r.htmlTemplates.ExecuteTemplate(&htmlBuf, htmlName, data); err != nil {
		return nil, fmt.Errorf("failed to render HTML template %s: %w", htmlName, err)
	}

	// Render plain text
	var textBuf bytes.Buffer
	if err := r.textTemplates.ExecuteTemplate(&textBuf, textName, data); err != nil {
		return nil, fmt.Errorf("failed to render text template %s: %w", textName, err)
	}

	return &RenderedEmail{
		Subject:   subject,
		HTMLBody:  htmlBuf.String(),
		PlainBody: textBuf.String(),
	}, nil
}
