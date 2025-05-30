-- Add phone_number column back and make country required again
ALTER TABLE users 
ADD COLUMN phone_number VARCHAR(15) NULL,
MODIFY COLUMN country VARCHAR(3) NOT NULL; 