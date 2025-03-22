#!/bin/bash
set -e

# Start MySQL
service mysql start

# Set up MySQL user and password
if [ -n "$DB_PASSWORD" ]; then
    echo "Setting MySQL root password..."
    mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DB_PASSWORD';"
    mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;"
    mysql -e "FLUSH PRIVILEGES;"
fi

# Create database if not exists
mysql -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

# Execute CMD
exec "$@" 