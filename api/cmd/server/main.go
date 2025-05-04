package main

import (
	"fmt"
	"log/slog"
	"os"

	"github.com/num30/config"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"github.com/xtp-tour/xtp-tour/api/pkg/metrics"

	"github.com/xtp-tour/xtp-tour/api/cmd/version"
	"github.com/xtp-tour/xtp-tour/api/pkg/server"
)

var serviceConfig = &pkg.Config{}

func main() {
	version.ProcessVersionArgument(pkg.ServiceName, os.Args, version.Version)

	loadConfig()

	level, err := ParseLevel(serviceConfig.LogLevel)
	if err != nil {
		slog.Error("Failed to parse log level", "error", err)
	}

	slog.SetLogLoggerLevel(level)

	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		db.RunMigrations(&serviceConfig.Db, os.Args[2:]...)
		return
	}
	if len(os.Args) > 1 && os.Args[1] == "help" {
		fmt.Println("migrate [up|down] - run migrations")
		fmt.Println("migrate drop - drop database")
		return
	}

	// Initialize database connection
	dbConn, err := db.GetDB(&serviceConfig.Db)
	if err != nil {
		slog.Error("Failed to initialize database connection", "error", err)
		os.Exit(1)
	}

	metrics.StartMetricsServer(&serviceConfig.Metrics)
	r := server.NewRouter(&serviceConfig.Service, dbConn, serviceConfig.IsDebugMode)
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

func ParseLevel(s string) (slog.Level, error) {
	var level slog.Level
	var err = level.UnmarshalText([]byte(s))
	return level, err
}
