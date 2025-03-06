package pkg

import (
	"github.com/gin-contrib/cors"
	"github.com/xtp-tour/xtp-tour/api/pkg/metrics"
)

type Config struct {
	IsDebugMode bool   `default:"false" envvar:"DEBUG_MODE"`
	LogLevel    string `default:"info" envvar:"LOG_LEVEL"`
	Metrics     metrics.MetricsConfig
	Service     HttpConfig
}

type HttpConfig struct {
	Port       int         `default:"8080" envvar:"SERVICE_PORT"`
	Cors       cors.Config `default:"{\"AllowOrigins\": [\"http://localhost\", \"https://localhost\", \"*\"]}"`
	AuthConfig AuthConfig
}

type AuthConfig struct {
	Type   string `default:"clerk" envvar:"AUTH_TYPE"`
	Config string `envvar:"AUTH_CONFIG"`
}
