package db

import (
	"fmt"
	"testing"

	"github.com/jmoiron/sqlx"
)

func TestIn(t *testing.T) {
	db := sqlx.NewDb(nil, "mysql")

	s := `SELECT * FROM events WHERE id IN (?) and status = ?`
	ids := []string{"1", "2", "3"}
	query, args, err := sqlx.In(s, ids)
	query = db.Rebind(query)
	fmt.Printf("query: %s\n", query)
	fmt.Printf("args: %v\n", args)

	if err != nil {
		t.Fatalf("Error in sqlx.In: %v", err)
	}

}
