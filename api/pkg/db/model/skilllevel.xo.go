package model

// Code generated by xo. DO NOT EDIT.

import (
	"database/sql/driver"
	"fmt"
)

// SkillLevel is the 'skill_level' enum type from schema 'xtp_tour'.
type SkillLevel uint16

// SkillLevel values.
const (
	// SkillLevelAny is the 'ANY' skill_level.
	SkillLevelAny SkillLevel = 1
	// SkillLevelBeginner is the 'BEGINNER' skill_level.
	SkillLevelBeginner SkillLevel = 2
	// SkillLevelIntermediate is the 'INTERMEDIATE' skill_level.
	SkillLevelIntermediate SkillLevel = 3
	// SkillLevelAdvanced is the 'ADVANCED' skill_level.
	SkillLevelAdvanced SkillLevel = 4
)

// String satisfies the [fmt.Stringer] interface.
func (sl SkillLevel) String() string {
	switch sl {
	case SkillLevelAny:
		return "ANY"
	case SkillLevelBeginner:
		return "BEGINNER"
	case SkillLevelIntermediate:
		return "INTERMEDIATE"
	case SkillLevelAdvanced:
		return "ADVANCED"
	}
	return fmt.Sprintf("SkillLevel(%d)", sl)
}

// MarshalText marshals [SkillLevel] into text.
func (sl SkillLevel) MarshalText() ([]byte, error) {
	return []byte(sl.String()), nil
}

// UnmarshalText unmarshals [SkillLevel] from text.
func (sl *SkillLevel) UnmarshalText(buf []byte) error {
	switch str := string(buf); str {
	case "ANY":
		*sl = SkillLevelAny
	case "BEGINNER":
		*sl = SkillLevelBeginner
	case "INTERMEDIATE":
		*sl = SkillLevelIntermediate
	case "ADVANCED":
		*sl = SkillLevelAdvanced
	default:
		return ErrInvalidSkillLevel(str)
	}
	return nil
}

// Value satisfies the [driver.Valuer] interface.
func (sl SkillLevel) Value() (driver.Value, error) {
	return sl.String(), nil
}

// Scan satisfies the [sql.Scanner] interface.
func (sl *SkillLevel) Scan(v interface{}) error {
	switch x := v.(type) {
	case []byte:
		return sl.UnmarshalText(x)
	case string:
		return sl.UnmarshalText([]byte(x))
	}
	return ErrInvalidSkillLevel(fmt.Sprintf("%T", v))
}

// NullSkillLevel represents a null 'skill_level' enum for schema 'xtp_tour'.
type NullSkillLevel struct {
	SkillLevel SkillLevel
	// Valid is true if [SkillLevel] is not null.
	Valid bool
}

// Value satisfies the [driver.Valuer] interface.
func (nsl NullSkillLevel) Value() (driver.Value, error) {
	if !nsl.Valid {
		return nil, nil
	}
	return nsl.SkillLevel.Value()
}

// Scan satisfies the [sql.Scanner] interface.
func (nsl *NullSkillLevel) Scan(v interface{}) error {
	if v == nil {
		nsl.SkillLevel, nsl.Valid = 0, false
		return nil
	}
	err := nsl.SkillLevel.Scan(v)
	nsl.Valid = err == nil
	return err
}

// ErrInvalidSkillLevel is the invalid [SkillLevel] error.
type ErrInvalidSkillLevel string

// Error satisfies the error interface.
func (err ErrInvalidSkillLevel) Error() string {
	return fmt.Sprintf("invalid SkillLevel(%s)", string(err))
}
