package common

// ErrorResponse represents a standard error response
type ErrorResponse struct {
	Error string `json:"error,omitempty"`
}

// ErrorMessage represents a detailed error message
type ErrorMessage struct {
	Message string `json:"message"`
	Details string `json:"details,omitempty"`
}