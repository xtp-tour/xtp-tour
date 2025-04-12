package api

import "time"

func ParseDt(iso string) time.Time {
	t, err := time.Parse("2006-01-02T15:04:05Z", iso)
	if err != nil {
		panic(err)
	}

	return t
}
