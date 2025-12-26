-- Remove EXPIRED status from events table (revert to original enum)
-- Note: This will fail if any rows have status='EXPIRED'
ALTER TABLE events MODIFY COLUMN status ENUM('OPEN', 'ACCEPTED', 'CONFIRMED', 'CANCELLED', 'RESERVATION_FAILED', 'COMPLETED') NOT NULL DEFAULT 'OPEN';

