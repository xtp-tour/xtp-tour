-- Create google_calendar_connections table
CREATE TABLE google_calendar_connections (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create index for quick user lookups
CREATE INDEX idx_google_calendar_user_id ON google_calendar_connections(user_id);

-- Create index for token expiry checks
CREATE INDEX idx_google_calendar_token_expiry ON google_calendar_connections(token_expiry);