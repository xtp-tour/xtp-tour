package db

import (
	"database/sql"
	"embed"

	"log/slog"
	"os"

	_ "github.com/go-sql-driver/mysql"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/mysql"

	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/xtp-tour/xtp-tour/api/pkg"
)

//go:embed sql/migrations/*.sql
var content embed.FS

func RunMigrations(dbConfig *pkg.DbConfig) {

	iofsSource, err := iofs.New(content, "sql/migrations")
	if err != nil {
		slog.Error("Failed to create migration source", "error", err)
		os.Exit(1)
	}

	db, err := sql.Open("mysql", dbConfig.GetConnectionString())
	if err != nil {
		slog.Error("Failed to open connection", "error", err)
		os.Exit(1)
	}

	driver, err := mysql.WithInstance(db, &mysql.Config{})
	if err != nil {
		slog.Error("Failed creating go-migrate driver", "error", err)
		os.Exit(1)
	}

	m, err := migrate.NewWithInstance("iofs", iofsSource, dbConfig.Database, driver)
	if err != nil {
		slog.Error("Failed to initialize migration", "error", err)
		os.Exit(1)
	}

	err = m.Up()
	if err != nil && err != migrate.ErrNoChange {
		slog.Error("Failed to run migrations", "error", err)
		os.Exit(1)
	}

	slog.Info("Migrations completed successfully")
}
