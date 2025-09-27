package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"github.com/num30/config"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/db"
	"github.com/xtp-tour/xtp-tour/api/pkg/metrics"
	"github.com/xtp-tour/xtp-tour/api/pkg/notifications"

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

	// Setup notification system
	queue := notifications.NewDbQueue(dbConn)

	// Create specific senders
	emailSender, err := notifications.NewRealEmailSender(serviceConfig.Notifications.Email, slog.Default())
	if err != nil {
		slog.Error("Failed to create email sender", "error", err)
		os.Exit(1)
	}
	smsSender := notifications.NewSMSSender()
	debugSender := notifications.NewDebugSender()

	// Create fan-out sender that routes based on user preferences
	fanOutSender := notifications.NewFanOutSender(emailSender, smsSender, debugSender)

	worker := notifications.NewNotificationWorker(queue, fanOutSender, serviceConfig.Notifications)
	notifier := notifications.NewAllPurposeNotifier(dbConn, queue)

	// Start background notification worker
	ctx := context.Background()
	go worker.Start(ctx)

	metrics.StartMetricsServer(&serviceConfig.Metrics)
	r := server.NewRouter(&serviceConfig.Service, dbConn, serviceConfig.IsDebugMode, notifier)
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
