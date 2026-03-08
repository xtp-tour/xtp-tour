-- Add role column to users table for admin identification
ALTER TABLE users ADD COLUMN role ENUM('user', 'admin') NOT NULL DEFAULT 'user';

-- Add columns to facilities for user-suggested places
ALTER TABLE facilities
    ADD COLUMN status ENUM('active', 'hidden') NOT NULL DEFAULT 'active',
    ADD COLUMN added_by VARCHAR(36) NULL,
    ADD COLUMN google_place_id VARCHAR(255) NULL,
    ADD COLUMN source ENUM('seed', 'user') NOT NULL DEFAULT 'seed';

-- Index for filtering by status (used in GetAllFacilities)
CREATE INDEX idx_facilities_status ON facilities(status);

-- Unique index to prevent duplicate Google Place entries
CREATE UNIQUE INDEX idx_facilities_google_place_id ON facilities(google_place_id);
