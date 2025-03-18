package model

import (
	"database/sql/driver"
	"encoding/binary"
	"encoding/json"
	"errors"
	"fmt"
	"math"
)

// Point represents a geographical point with latitude and longitude for MySQL spatial data
type Point struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

// Value implements the driver.Valuer interface for database/sql
// This converts our Point to MySQL's POINT format
func (p Point) Value() (driver.Value, error) {
	// For inserting into MySQL, you'd typically use:
	// ST_PointFromText(CONCAT('POINT(', ?, ' ', ?, ')'), 4326)
	// But since we're just reading, we're not implementing this fully
	return fmt.Sprintf("POINT(%f %f)", p.Lng, p.Lat), nil
}

// Scan implements the sql.Scanner interface for database/sql
// This converts MySQL's POINT binary format to our Point struct
func (p *Point) Scan(value interface{}) error {
	if value == nil {
		*p = Point{}
		return nil
	}

	// MySQL spatial data is returned as []byte in Well-Known Binary (WKB) format
	b, ok := value.([]byte)
	if !ok {
		return errors.New("type assertion to []byte failed")
	}

	// Check if it's a JSON format first
	if len(b) > 0 && (b[0] == '{' || b[0] == '[') {
		return json.Unmarshal(b, p)
	}

	// If it's empty or too short to be a valid WKB, return empty point
	if len(b) < 21 {
		*p = Point{}
		return nil
	}

	// MySQL POINT format:
	// 4 bytes SRID + 1 byte (byte order) + 4 bytes (WKB type) + 8 bytes (X) + 8 bytes (Y)

	// Skip first 5 bytes (SRID + byte order)
	// Then skip 4 bytes (WKB type which is 1 for POINT)
	// Then read X (longitude) and Y (latitude) as IEEE 754 double-precision values

	// Longitude (X) - bytes 9-16
	lng := math.Float64frombits(binary.LittleEndian.Uint64(b[9:17]))

	// Latitude (Y) - bytes 17-24
	lat := math.Float64frombits(binary.LittleEndian.Uint64(b[17:25]))

	*p = Point{
		Lat: lat,
		Lng: lng,
	}

	return nil
}

// String returns a string representation of the Point
func (p Point) String() string {
	return fmt.Sprintf("POINT(%f %f)", p.Lng, p.Lat)
}
