#!/usr/bin/env bash
# Service tests: ephemeral MySQL in Docker, migrate, API server, go test ./test/stest.
# Intended to be run from the api/ directory (via `make str`).

set -euo pipefail

cd "$(dirname "$0")/.."

DB_PORT="${DB_PORT:-53306}"
SERVICE_PORT="${SERVICE_PORT:-58180}"
METRICS_PORT="${METRICS_PORT:-51180}"
TOKEN_ENCRYPTION_KEY="${TOKEN_ENCRYPTION_KEY:-sRMufszenT/pOV8bE2vIqqtWNjxrhhlfvPHdz0cBBTY=}"

SERVER_PID=""

cleanup() {
	echo "Cleaning up..."
	if [ -n "${SERVER_PID}" ]; then
		kill "${SERVER_PID}" 2>/dev/null || true
	fi
	docker stop xtp-tour-stest-db 2>/dev/null || true
	docker rm xtp-tour-stest-db 2>/dev/null || true
}
trap cleanup EXIT

echo "Starting database container..."
docker run -d --name xtp-tour-stest-db -p "${DB_PORT}:3306" \
	-e MYSQL_ROOT_PASSWORD=password \
	-e MYSQL_DATABASE=xtp_tour \
	mysql:9.3.0

echo "Waiting for database to be ready (host port ${DB_PORT} + mysqld)..."
for i in $(seq 1 90); do
	if (echo >/dev/tcp/127.0.0.1/"${DB_PORT}") 2>/dev/null &&
		docker exec xtp-tour-stest-db mysqladmin ping -h localhost -uroot -ppassword --silent 2>/dev/null; then
		echo "MySQL is ready."
		break
	fi
	if [ "${i}" -eq 90 ]; then
		echo "MySQL did not become ready within 90s"
		exit 1
	fi
	sleep 1
done

sleep 2

echo "Running migrations..."
migrate_ok=0
for attempt in 1 2 3 4 5; do
	if DB_HOST=127.0.0.1 DB_PORT="${DB_PORT}" LOG_LEVEL=debug go run cmd/server/main.go migrate; then
		migrate_ok=1
		break
	fi
	echo "migrate attempt ${attempt} failed, retrying in 4s..."
	sleep 4
done
if [ "${migrate_ok}" != "1" ]; then
	echo "migrate failed after 5 attempts"
	exit 1
fi

echo "Starting server in background..."
AUTH_TYPE=debug LOG_LEVEL=debug DB_HOST=127.0.0.1 DB_PORT="${DB_PORT}" \
	SERVICE_PORT="${SERVICE_PORT}" METRICS_PORT="${METRICS_PORT}" \
	TOKEN_ENCRYPTION_KEY="${TOKEN_ENCRYPTION_KEY}" \
	go run cmd/server/main.go &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 2

echo "Running service tests..."
set +e
SERVICE_HOST="http://localhost:${SERVICE_PORT}" METRICS_HOST="http://localhost:${METRICS_PORT}" \
	go test ./test/stest -tags servicetest -v -count=1
TEST_EXIT=$?
set -e
exit "${TEST_EXIT}"
