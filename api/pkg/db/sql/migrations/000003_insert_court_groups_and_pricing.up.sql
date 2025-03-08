-- This is not complete data. 


-- Insert court groups for Matchpoint
INSERT INTO court_groups (facility_id, surface, type, light, heating, reservation_link, court_names) VALUES
('matchpoint', 'hard', 'indoor', false, false, 'https://matchpoint.gymmanager.com.pl/ClassroomReservation', '1,2');

SET @matchpoint_indoor_id = LAST_INSERT_ID();

INSERT INTO court_groups (facility_id, surface, type, light, heating, reservation_link, court_names) VALUES
('matchpoint', 'hard', 'tent', false, false, 'https://matchpoint.gymmanager.com.pl/ClassroomReservation', '4,5,6,7');

SET @matchpoint_tent_id = LAST_INSERT_ID();

-- Insert price periods and rules for Matchpoint indoor courts
INSERT INTO price_periods (court_group_id, valid_from, valid_to) VALUES
(@matchpoint_indoor_id, '2024-05-01', '2024-10-01');

SET @price_period_id = LAST_INSERT_ID();

INSERT INTO price_rules (price_period_id, day_pattern, time_start, time_end, price) VALUES
(@price_period_id, '*', '07:00', '15:00', 60),
(@price_period_id, '*', '15:00', '23:00', 80),
(@price_period_id, '!', '23:00', '06:00', 50),
(@price_period_id, 'st', '07:00', '15:00', 80),
(@price_period_id, 'st', '15:00', '23:00', 60),
(@price_period_id, 'su', '00:00', '23:00', 50);

-- Insert price periods and rules for Matchpoint tent courts
INSERT INTO price_periods (court_group_id, valid_from, valid_to) VALUES
(@matchpoint_tent_id, '2024-10-01', '2025-05-01');

SET @price_period_id = LAST_INSERT_ID();

INSERT INTO price_rules (price_period_id, day_pattern, time_start, time_end, price) VALUES
(@price_period_id, '*', '07:00', '15:00', 140),
(@price_period_id, '*', '15:00', '23:00', 170),
(@price_period_id, 'st', '00:00', '15:00', 170),
(@price_period_id, 'st', '15:00', '23:00', 140),
(@price_period_id, 'su', '00:00', '23:00', 140),
(@price_period_id, '!', '23:00', '06:00', 110);

-- Insert court groups for Krzycka Park
INSERT INTO court_groups (facility_id, surface, type, light, heating, reservation_link, court_names) VALUES
('krzycka-park', 'clay', 'outdoor', true, false, 'https://www.twojtenis.pl/pl/kluby/krzycka_park/courts_list.html', '3,4');

SET @krzycka_outdoor_id = LAST_INSERT_ID();

INSERT INTO court_groups (facility_id, surface, type, light, heating, reservation_link, court_names) VALUES
('krzycka-park', 'clay', 'tent', false, false, 'https://www.twojtenis.pl/pl/kluby/krzycka_park/courts_list.html', '1,2');

SET @krzycka_tent_id = LAST_INSERT_ID();

INSERT INTO court_groups (facility_id, surface, type, light, heating, reservation_link, court_names) VALUES
('krzycka-park', 'artificial-grass', 'baloon', false, false, 'https://www.twojtenis.pl/pl/kluby/krzycka_park/courts_list.html', '5');

SET @krzycka_baloon_id = LAST_INSERT_ID();

-- Insert price periods and rules for Krzycka Park outdoor courts
INSERT INTO price_periods (court_group_id, valid_from, valid_to) VALUES
(@krzycka_outdoor_id, '2024-05-01', '2024-11-01');

SET @price_period_id = LAST_INSERT_ID();

INSERT INTO price_rules (price_period_id, day_pattern, time_start, time_end, price) VALUES
(@price_period_id, '*', '07:00', '15:00', 40),
(@price_period_id, '*', '15:00', '23:00', 50),
(@price_period_id, 'su', '07:00', '23:00', 45),
(@price_period_id, 'st', '07:00', '23:00', 45),
(@price_period_id, 'hl', '07:00', '23:00', 45);

-- Insert price periods and rules for Krzycka Park tent courts
INSERT INTO price_periods (court_group_id, valid_from, valid_to) VALUES
(@krzycka_tent_id, '2024-10-01', '2025-05-01');

SET @price_period_id = LAST_INSERT_ID();

INSERT INTO price_rules (price_period_id, day_pattern, time_start, time_end, price) VALUES
(@price_period_id, '*', '07:00', '15:00', 110),
(@price_period_id, '*', '15:00', '23:00', 170),
(@price_period_id, 'st', '07:00', '23:00', 120),
(@price_period_id, 'su', '07:00', '23:00', 120),
(@price_period_id, 'hl', '07:00', '23:00', 120);

-- Insert court groups for Spartan Pułtuska
INSERT INTO court_groups (facility_id, surface, type, light, heating, reservation_link, court_names) VALUES
('spartan-pultuska', 'clay', 'outdoor', true, false, 'https://spartan.wroc.pl/pultuska/strefaklienta/index.php?s=rezerwacje_kortow', '1,2,3,4,C,5,6');

SET @spartan_pultuska_outdoor_id = LAST_INSERT_ID();

INSERT INTO court_groups (facility_id, surface, type, light, heating, reservation_link, court_names) VALUES
('spartan-pultuska', 'hard', 'tent', false, false, 'https://spartan.wroc.pl/pultuska/strefaklienta/index.php?s=rezerwacja_hali_tenisowej', '1,2,3,4,5');

SET @spartan_pultuska_tent_id = LAST_INSERT_ID();

-- Insert price periods and rules for Spartan Pułtuska outdoor courts
INSERT INTO price_periods (court_group_id, valid_from, valid_to) VALUES
(@spartan_pultuska_outdoor_id, '2024-05-01', '2024-11-11');

SET @price_period_id = LAST_INSERT_ID();

INSERT INTO price_rules (price_period_id, day_pattern, time_start, time_end, price) VALUES
(@price_period_id, '*', '07:00', '11:00', 55),
(@price_period_id, '*', '11:00', '16:00', 44),
(@price_period_id, '*', '16:00', '22:00', 68),
(@price_period_id, 'st', '07:00', '22:00', 55),
(@price_period_id, 'su', '07:00', '22:00', 55),
(@price_period_id, 'hl', '07:00', '22:00', 55);

-- Insert price periods and rules for Spartan Pułtuska tent courts
INSERT INTO price_periods (court_group_id, valid_from, valid_to) VALUES
(@spartan_pultuska_tent_id, '2024-10-01', '2025-05-01');

SET @price_period_id = LAST_INSERT_ID();

INSERT INTO price_rules (price_period_id, day_pattern, time_start, time_end, price) VALUES
(@price_period_id, '*', '07:00', '11:00', 140),
(@price_period_id, '*', '11:00', '16:00', 110),
(@price_period_id, '*', '16:00', '22:00', 170),
(@price_period_id, 'sa', '07:00', '14:00', 140),
(@price_period_id, 'su', '07:00', '14:00', 140),
(@price_period_id, 'hl', '07:00', '14:00', 140),
(@price_period_id, 'sa', '14:00', '22:00', 120),
(@price_period_id, 'su', '14:00', '22:00', 120),
(@price_period_id, 'hl', '14:00', '22:00', 120); 