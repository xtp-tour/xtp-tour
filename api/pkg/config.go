package pkg

import (
	"fmt"

	"github.com/gin-contrib/cors"
	"github.com/xtp-tour/xtp-tour/api/pkg/metrics"
)

type Config struct {
	IsDebugMode   bool   `default:"false" envvar:"DEBUG_MODE"`
	LogLevel      string `default:"info" envvar:"LOG_LEVEL"`
	Metrics       metrics.MetricsConfig
	Service       HttpConfig
	Db            DbConfig
	Notifications NotificationConfig
}

type NotificationConfig struct {
	MaxRetries    int         `default:"3" envvar:"NOTIFICATION_MAX_RETRIES"`
	TickerSeconds int         `default:"5" envvar:"NOTIFICATION_TICKER_SECONDS"`
	Email         EmailConfig `config:"email"`
}

type EmailConfig struct {
	SmtpHost string `default:"smtp.zeptomail.eu" envvar:"EMAIL_HOST"`
	Port     int    `default:"587" envvar:"EMAIL_PORT"`
	Username string `envvar:"EMAIL_USERNAME"`
	Password string `envvar:"EMAIL_PASSWORD"`
	From     string `envvar:"EMAIL_FROM"`
	Enabled  bool   `default:"false" envvar:"EMAIL_ENABLED"`
}

type HttpConfig struct {
	Port           int          `default:"8080" envvar:"SERVICE_PORT"`
	Cors           *cors.Config `default:"{\"AllowOrigins\":[\"http://localhost\"],\"AllowMethods\":[\"GET\",\"POST\",\"PUT\",\"DELETE\",\"OPTIONS\"],\"AllowHeaders\":[\"Origin\",\"Content-Length\",\"Content-Type\",\"Authorization\"],\"ExposeHeaders\":[\"Content-Length\"],\"AllowCredentials\":true,\"MaxAge\":43200000000000}"`
	AuthConfig     AuthConfig
	GoogleCalendar GoogleCalendarConfig
}

type AuthConfig struct {
	Type   string `default:"clerk" envvar:"AUTH_TYPE"`
	Config string `envvar:"AUTH_CONFIG"`
}

type GoogleCalendarConfig struct {
	ClientID     string `envvar:"GOOGLE_CALENDAR_CLIENT_ID"`
	ClientSecret string `envvar:"GOOGLE_CALENDAR_CLIENT_SECRET"`
	RedirectURL  string `envvar:"GOOGLE_CALENDAR_REDIRECT_URL"`
}

// MySql compatible config
type DbConfig struct {
	Host     string `default:"127.0.0.1" envvar:"DB_HOST"`
	Port     int    `default:"33306" envvar:"DB_PORT"`
	User     string `default:"root" envvar:"DB_USER"`
	Password string `default:"password" envvar:"DB_PASSWORD"`
	Database string `default:"xtp_tour" envvar:"DB_NAME"`
}

func (c *DbConfig) GetConnectionString() string {
	return fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true&multiStatements=true", c.User, c.Password, c.Host, c.Port, c.Database)
}
