package main

import (
	"log/slog"
	"os"

	"github.com/num30/config"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/metrics"

	"github.com/xtp-tour/xtp-tour/api/cmd/version"

	ccmd "github.com/xtp-tour/xtp-tour/api/pkg/cmd"
	"github.com/xtp-tour/xtp-tour/api/pkg/server"
)

var serviceConfig = &pkg.Config{}

func main() {
	ccmd.ProcessVersionArgument(pkg.ServiceName, os.Args, version.Version)

	loadConfig()

	metrics.StartMetricsServer(&serviceConfig.Metrics)
	r := server.NewRouter(&serviceConfig.Service, serviceConfig.IsDebugMode)
	r.Run()
}

// loadConfig reads in config file, ENV variables, and flags if set.
func loadConfig() {
	err := config.NewConfReader("service_test").Read(serviceConfig)
	if err != nil {
		slog.With("error", err).Error("Error reading config")
		os.Exit(1)
	}
}
