-- Drop tables in reverse order of creation to handle foreign key constraints
DROP TABLE IF EXISTS confirmation_join_requests;
DROP TABLE IF EXISTS confirmations;
DROP TABLE IF EXISTS join_request_time_slots;
DROP TABLE IF EXISTS join_request_locations;
DROP TABLE IF EXISTS join_requests;
DROP TABLE IF EXISTS event_time_slots;
DROP TABLE IF EXISTS event_locations;
DROP TABLE IF EXISTS events;