package db

import (
	"context"
	"database/sql"
	"log/slog"
	"sync"

	_ "github.com/go-sql-driver/mysql"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/db/model"
)

var (
	instance *sql.DB
	once     sync.Once
	mutex    sync.Mutex
)

// GetDB returns a singleton database connection
func GetDB(config *pkg.DbConfig) (*sql.DB, error) {
	var err error

	once.Do(func() {
		slog.Info("Initializing database connection", "host", config.Host, "port", config.Port, "database", config.Database)
		instance, err = sql.Open("mysql", config.GetConnectionString())
		if err != nil {
			slog.Error("Failed to connect to database", "error", err)
			return
		}

		err = instance.Ping()
		if err != nil {
			slog.Error("Failed to ping database", "error", err)
			return
		}

		// Configure connection pool
		instance.SetMaxOpenConns(25)
		instance.SetMaxIdleConns(5)

		slog.Info("Database connection established")
	})

	if err != nil {
		return nil, err
	}

	return instance, nil
}

// GetAllFacilities retrieves all facilities from the database
func GetAllFacilities(ctx context.Context, db model.DB) ([]*model.Facility, error) {
	query := `SELECT id, name, address, google_maps_link, website, country, location FROM xtp_tour.facilities`

	rows, err := db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var facilities []*model.Facility
	for rows.Next() {
		f := &model.Facility{}

		if err := rows.Scan(&f.ID, &f.Name, &f.Address, &f.GoogleMapsLink, &f.Website, &f.Country, &f.Location); err != nil {
			return nil, err
		}

		facilities = append(facilities, f)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return facilities, nil
}
