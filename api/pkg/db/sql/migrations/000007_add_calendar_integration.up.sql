-- Create user_calendar_connections table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS user_calendar_connections (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'google',
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expiry DATETIME NOT NULL,
    calendar_id VARCHAR(255) NOT NULL DEFAULT 'primary',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_provider (user_id, provider),
    INDEX idx_user_active (user_id, is_active)
);

-- Create user_calendar_preferences table for storing user settings
CREATE TABLE IF NOT EXISTS user_calendar_preferences (
    user_id VARCHAR(36) PRIMARY KEY,
    sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    sync_frequency_minutes INT NOT NULL DEFAULT 30,
    show_event_details BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create calendar_busy_times table for caching busy periods
CREATE TABLE IF NOT EXISTS calendar_busy_times (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    event_title VARCHAR(255),
    synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_time_range (user_id, start_time, end_time),
    INDEX idx_synced_at (synced_at)
);