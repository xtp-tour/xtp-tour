package core

import "time"

type User struct {
	ID          string    `json:"id"`
	PhoneNumber string    `json:"phone_number"`
	ExternalID  string    `json:"external_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type ChallengeStatus string

const (
	ChallengeStatusPending   ChallengeStatus = "pending"
	ChallengeStatusAccepted  ChallengeStatus = "accepted"
	ChallengeStatusConfirmed ChallengeStatus = "confirmed"
)

type Challenge struct {
	User *User `json:"user"`
}

// type

// type Matcher struct {

// }

// func (m *Matcher) CreateChallenge (userId string,  )
