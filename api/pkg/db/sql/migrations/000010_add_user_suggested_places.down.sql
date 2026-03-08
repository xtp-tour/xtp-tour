DROP INDEX idx_facilities_google_place_id ON facilities;
DROP INDEX idx_facilities_status ON facilities;

ALTER TABLE facilities
    DROP COLUMN source,
    DROP COLUMN google_place_id,
    DROP COLUMN added_by,
    DROP COLUMN status;

ALTER TABLE users DROP COLUMN role;
