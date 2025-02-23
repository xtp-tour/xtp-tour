package pkg

import (
	"github.com/xtp-tour/xtp-tour/api/pkg/metrics"
	"github.com/xtp-tour/xtp-tour/api/pkg/rest"
)

type Config struct {
	IsDebugMode bool   `default:"false" envvar:"DEBUG_MODE"`
	LogLevel    string `default:"info" envvar:"LOG_LEVEL"`
	Metrics     metrics.MetricsConfig
	Service     rest.HttpConfig
}
