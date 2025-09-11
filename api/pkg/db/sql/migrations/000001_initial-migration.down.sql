-- Drop tables in reverse order of creation to handle foreign key constraints
DROP TABLE IF EXISTS price_rules;
DROP TABLE IF EXISTS price_periods;
DROP TABLE IF EXISTS court_groups;
DROP TABLE IF EXISTS facility_partner_cards;
DROP TABLE IF EXISTS partner_cards;
DROP TABLE IF EXISTS facilities;
DROP TABLE IF EXISTS user_pref;
DROP TABLE IF EXISTS users;
