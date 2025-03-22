#!/bin/bash
set -e

# Start MySQL
service mysql start

# Set up MySQL user and password
DB_PASSWORD=${DB_PASSWORD:-password}
echo "Setting MySQL root password..."
mysql -e "CREATE DATABASE IF NOT EXISTS xtp_tour;"

mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$DB_PASSWORD';"
#mysql -e "GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;"
#mysql -e "FLUSH PRIVILEGES;"


# Execute CMD
exec "$@" 