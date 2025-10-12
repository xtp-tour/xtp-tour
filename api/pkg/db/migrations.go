package db

import (
	"database/sql"
	"embed"
	"fmt"
	"strings"

	"log/slog"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database"
	"github.com/golang-migrate/migrate/v4/database/mysql"

	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/xtp-tour/xtp-tour/api/pkg"
)

//go:embed sql/migrations/*.sql
var content embed.FS

func RunMigrations(dbConfig *pkg.DbConfig, args ...string) {

	iofsSource, err := iofs.New(content, "sql/migrations")
	if err != nil {
		slog.Error("Failed to create migration source", "error", err)
		os.Exit(1)
	}
	driver := getDriver(dbConfig)

	m, err := migrate.NewWithInstance("iofs", iofsSource, dbConfig.Database, driver)
	if err != nil {
		slog.Error("Failed to initialize migration", "error", err)
		os.Exit(1)
	}

	if len(args) > 0 && args[0] == "down" {
		slog.Warn("RUNNING MIGRATION DOWN - This will rollback database changes!", "database", dbConfig.Database)

		// Add confirmation in non-production environments
		if os.Getenv("ENVIRONMENT") != "production" {
			fmt.Print("Are you sure you want to rollback migrations? This will delete data! (yes/no): ")
			var response string
			fmt.Scanln(&response)
			if response != "yes" {
				slog.Info("Migration rollback cancelled")
				return
			}
		}

		err = m.Down()
		if err != nil && err != migrate.ErrNoChange {
			slog.Error("Failed to run migrations", "error", err)
			os.Exit(1)
		}
		return
	}
	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		slog.Error("Failed to run migrations", "error", err)
		os.Exit(1)
	}

	slog.Info("Migrations completed successfully")
}

func getDriver(dbConfig *pkg.DbConfig) database.Driver {
	db, err := sql.Open("mysql", dbConfig.GetConnectionString())
	if err != nil {
		slog.Error("Failed to open connection", "error", err)
		os.Exit(1)
	}

	driver, err := mysql.WithInstance(db, &mysql.Config{})
	if err != nil {
		if strings.Contains(err.Error(), "Error 1049") { // Unknown database
			createDbIfNotExist(dbConfig)
			return getDriver(dbConfig)
		}

		slog.Error("Failed creating go-migrate driver", "error", err)
		os.Exit(1)
	}
	return driver
}

func createDbIfNotExist(dbConfig *pkg.DbConfig) {
	db, err := sql.Open("mysql", fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?parseTime=true&multiStatements=true", dbConfig.User, dbConfig.Password, dbConfig.Host, dbConfig.Port, ""))
	if err != nil {
		slog.Error("Failed to open connection", "error", err)
		os.Exit(1)
	}

	_, err = db.Exec(fmt.Sprintf("CREATE DATABASE IF NOT EXISTS %s", dbConfig.Database))
	if err != nil {
		slog.Error("Failed to create database", "error", err)
		os.Exit(1)
	}
}
