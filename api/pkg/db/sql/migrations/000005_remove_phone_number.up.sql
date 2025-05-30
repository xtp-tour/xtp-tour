-- Remove phone_number column and make country nullable for social login users
ALTER TABLE users 
DROP COLUMN phone_number,
MODIFY COLUMN country VARCHAR(3) NULL; 