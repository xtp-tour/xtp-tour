CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(36) PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    country VARCHAR(3) NOT NULL,
    external_id VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    username VARCHAR(50) UNIQUE,
    profile_picture_url VARCHAR(512),
    ntrp_level DECIMAL(2,1) CHECK (ntrp_level >= 1.0 AND ntrp_level <= 7.0),
    preferred_city VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE user_pref (
    uid VARCHAR(36) PRIMARY KEY,
    language VARCHAR(5) NOT NULL,
    country VARCHAR(3) NOT NULL,
    city VARCHAR(255),
    FOREIGN KEY (uid) REFERENCES users(uid) ON DELETE CASCADE
);

-- Tennis facilities

CREATE TABLE facilities (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    google_maps_link VARCHAR(1024),
    website VARCHAR(512),
    country VARCHAR(3) NOT NULL,
    location POINT NOT NULL SRID 4326,
    SPATIAL INDEX idx_location (location)
);

-- Create partner cards table
CREATE TABLE partner_cards (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    name VARCHAR(200) NOT NULL
);

-- Create facility partner cards join table
CREATE TABLE facility_partner_cards (
    facility_id VARCHAR(36) NOT NULL,
    partner_card_id VARCHAR(36) NOT NULL,
    PRIMARY KEY (facility_id, partner_card_id),
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE,
    FOREIGN KEY (partner_card_id) REFERENCES partner_cards(id) ON DELETE CASCADE
);

-- Create court groups table
CREATE TABLE court_groups (
    id INT AUTO_INCREMENT PRIMARY KEY ,
    facility_id VARCHAR(36) NOT NULL,
    surface ENUM('hard', 'clay', 'artificial-grass', 'carpet', 'grass') NOT NULL,
    type ENUM('indoor', 'outdoor', 'tent', 'balloon', 'baloon') NOT NULL,
    light BOOLEAN DEFAULT FALSE,
    heating BOOLEAN DEFAULT FALSE,
    reservation_link VARCHAR(512),
    court_names TEXT, -- Comma separated name of courts
    FOREIGN KEY (facility_id) REFERENCES facilities(id) ON DELETE CASCADE
);


-- Create price periods table
CREATE TABLE price_periods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    court_group_id INT NOT NULL,
    valid_from DATE NOT NULL,
    valid_to DATE NOT NULL,
    FOREIGN KEY (court_group_id) REFERENCES court_groups(id) ON DELETE CASCADE
);

-- Create price schedule rules table
CREATE TABLE price_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    price_period_id INT NOT NULL,
    day_pattern VARCHAR(10) NOT NULL COMMENT 'e.g., "*" (everyday except those specified), "st" (Saturday), "su" (Sunday), "hl" (Holiday), "!" (everyday force)',
    time_start TIME NOT NULL,
    time_end TIME NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (price_period_id) REFERENCES price_periods(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_court_groups_facility ON court_groups(facility_id);
CREATE INDEX idx_price_periods_court_group ON price_periods(court_group_id);
CREATE INDEX idx_price_rules_price_period ON price_rules(price_period_id);