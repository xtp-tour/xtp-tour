package api

import "time"

func ParseDt(iso string) time.Time {
	t, err := time.Parse("2006-01-02T15:04:05Z", iso)
	if err != nil {
		panic(err)
	}

	return t
}

func DtToIso(dt time.Time) string {
	return dt.UTC().Format("2006-01-02T15:04:05Z")
}

func DtToIsoArray(dts []time.Time) []string {
	result := make([]string, len(dts))
	for i, dt := range dts {
		result[i] = DtToIso(dt)
	}
	return result
}

func DtFromIsoArray(isos []string) []time.Time {
	result := make([]time.Time, len(isos))
	for i, iso := range isos {
		result[i] = ParseDt(iso)
	}
	return result
}
