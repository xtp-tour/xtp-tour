package db

import (
	"context"
	"database/sql"
	"log/slog"
	"sync"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stephenafamo/bob"
	"github.com/xtp-tour/xtp-tour/api/pkg"
	"github.com/xtp-tour/xtp-tour/api/pkg/db/models"
)

var (
	once  sync.Once
	mutex sync.Mutex
)

type Db struct {
	bob bob.DB
}

// GetDB returns a singleton database connection
func GetDB(config *pkg.DbConfig) (*Db, error) {
	var err error

	mutex.Lock()
	defer mutex.Unlock()

	slog.Info("Initializing database connection", "host", config.Host, "port", config.Port, "database", config.Database)
	instance, err := sql.Open("mysql", config.GetConnectionString())
	if err != nil {
		slog.Error("Failed to connect to database", "error", err)
		return nil, err
	}

	err = instance.Ping()
	if err != nil {
		slog.Error("Failed to ping database", "error", err)
		return nil, err
	}

	// Configure connection pool
	instance.SetMaxOpenConns(25)
	instance.SetMaxIdleConns(5)

	slog.Info("Database connection established")
	return &Db{bob: bob.NewDB(instance)}, nil

}

func (db *Db) Ping() error {
	_, err := db.bob.QueryContext(context.Background(), "SELECT 1")
	return err
}

// GetAllFacilities retrieves all facilities from the database
func (db *Db) GetAllFacilities(ctx context.Context) ([]*models.Facility, error) {
	return models.Facilities.Query(
		models.ThenLoadFacilityCourtGroups(),
		models.ThenLoadFacilityEvents(),
		models.ThenLoadFacilityPartnerCards(),
	).All(ctx, db.bob)
}
