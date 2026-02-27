package api

import (
	"encoding/json"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Test_JoinRequest_AcceptedRequestNotRejectedInJson verifies that an accepted
// join request serializes as isRejected:false so the frontend acks counter
// correctly includes it (filter: req.isRejected !== true).
func Test_JoinRequest_AcceptedRequestNotRejectedInJson(t *testing.T) {
	notRejected := false
	req := JoinRequest{
		JoinRequestData: JoinRequestData{
			Id:        "test-id",
			Locations: []string{"loc1"},
			TimeSlots: []string{"2024-01-01T10:00:00Z"},
		},
		UserId:     "user1",
		IsRejected: &notRejected,
	}

	data, err := json.Marshal(req)
	require.NoError(t, err)

	var m map[string]interface{}
	require.NoError(t, json.Unmarshal(data, &m))

	isRejected, hasField := m["isRejected"]
	assert.True(t, hasField, "isRejected field should be present")
	assert.Equal(t, false, isRejected, "accepted request should have isRejected=false")
}

// Test_JoinRequest_RejectedRequestIsRejectedInJson verifies that a rejected
// join request serializes as isRejected:true so the frontend filter excludes it.
func Test_JoinRequest_RejectedRequestIsRejectedInJson(t *testing.T) {
	rejected := true
	req := JoinRequest{
		JoinRequestData: JoinRequestData{
			Id:        "test-id",
			Locations: []string{"loc1"},
			TimeSlots: []string{"2024-01-01T10:00:00Z"},
		},
		UserId:     "user1",
		IsRejected: &rejected,
	}

	data, err := json.Marshal(req)
	require.NoError(t, err)

	var m map[string]interface{}
	require.NoError(t, json.Unmarshal(data, &m))

	isRejected, hasField := m["isRejected"]
	assert.True(t, hasField, "isRejected field should be present")
	assert.Equal(t, true, isRejected, "rejected request should have isRejected=true")
}

// Test_JoinRequest_PendingRequestIsNotRejectedInJson verifies that a pending
// join request correctly omits the isRejected field.
func Test_JoinRequest_PendingRequestIsNotRejectedInJson(t *testing.T) {
	req := JoinRequest{
		JoinRequestData: JoinRequestData{
			Id:        "test-id",
			Locations: []string{"loc1"},
			TimeSlots: []string{"2024-01-01T10:00:00Z"},
		},
		UserId:     "user1",
		IsRejected: nil,
	}

	data, err := json.Marshal(req)
	require.NoError(t, err)

	var m map[string]interface{}
	require.NoError(t, json.Unmarshal(data, &m))

	_, hasField := m["isRejected"]
	assert.False(t, hasField, "pending request should not have isRejected field (omitempty)")
}
