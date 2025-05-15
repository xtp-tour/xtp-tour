-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    skill_level ENUM('ANY', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED') NOT NULL,
    description TEXT,
    event_type ENUM('MATCH', 'TRAINING') NOT NULL,
    expected_players INT NOT NULL,
    session_duration INT NOT NULL,
    status ENUM('OPEN', 'ACCEPTED', 'CONFIRMED', 'CANCELLED', 'RESERVATION_FAILED', 'COMPLETED') NOT NULL DEFAULT 'OPEN',
    visibility ENUM('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expiration_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP    
);

-- Create event_locations table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS event_locations (
    event_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (event_id, location_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES facilities(id) ON DELETE CASCADE
);

-- Create event_time_slots table
CREATE TABLE IF NOT EXISTS event_time_slots (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    event_id VARCHAR(36) NOT NULL,
    dt DATETIME NOT NULL,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Create confirmations table
CREATE TABLE IF NOT EXISTS confirmations (
    id VARCHAR(36) PRIMARY KEY,
    event_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NOT NULL,
    dt DATETIME NOT NULL,
    duration INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES facilities(id) ON DELETE CASCADE
);

-- Create join_requests table
CREATE TABLE IF NOT EXISTS join_requests (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    event_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    confirmation_id VARCHAR(36) NULL,
    is_accepted BOOLEAN NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE    
);

-- Create join_request_locations table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS join_request_locations (
    join_request_id VARCHAR(36) NOT NULL,
    location_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (join_request_id, location_id),
    FOREIGN KEY (join_request_id) REFERENCES join_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (location_id) REFERENCES facilities(id) ON DELETE CASCADE
);

-- Create join_request_time_slots table
CREATE TABLE IF NOT EXISTS join_request_time_slots (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    join_request_id VARCHAR(36) NOT NULL,
    dt DATETIME NOT NULL,
    FOREIGN KEY (join_request_id) REFERENCES join_requests(id) ON DELETE CASCADE
);