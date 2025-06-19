.PHONY:  test build lint deps

build: servicetest.build
	@echo Building version: \"$(BIN_VER)\"
	env CGO_ENABLED=0 go build -ldflags='-X github.com/xtp-tour/xtp-tour/api/cmd/version.Version=$(BIN_VER) -extldflags=-static' -o bin/api cmd/server/main.go

migrate:
	go run ./... migrate

dbreset:
	mysql -h 127.0.0.1 -P 33306 -u root --password="password" -e "DROP DATABASE xtp_tour;"
	go run ./... migrate

test:
	go test -v ./...

# Go lint
lint:
	golangci-lint run

deps:
	go install github.com/xo/xo@latest

clean:
	rm pb/gen/*.go

run:
	go run cmd/server/main.go

# Development mode with hot-reload
dev:
	air

gen-schemas:
	go run ./... migrate
	xo schema "mysql://root:password@127.0.0.1:33306/xtp_tour?parseTime=true&sql_mode=ansi"  -o pkg/db/model

# service tests
servicetest.run:
	go test ./test/stest -tags servicetest  -v -count=1


servicetest.build:
	env CGO_ENABLED=0 go test ./test/stest -tags servicetest -v -c -o bin/service-test

run-deploy:
	docker compose -f docker-compose.yaml -f docker-compose.deploy.yml up

# runs service tests against local database
str:
	@bash -c '\
	set -e; \
	cleanup() { \
		echo "Cleaning up..."; \
		kill $$SERVER_PID 2>/dev/null || true; \
		docker stop xtp-tour-stest-db 2>/dev/null || true; \
		docker rm xtp-tour-stest-db 2>/dev/null || true; \
	}; \
	trap cleanup EXIT; \
	echo "Starting database container..."; \
	docker run -d --name xtp-tour-stest-db -p 53306:3306 -e MYSQL_ROOT_PASSWORD=password -e MYSQL_DATABASE=xtp_tour mysql:9.3.0; \
	echo "Running migrations..."; \
	go run cmd/server/main.go migrate; \
	echo "Starting server in background..."; \
	AUTH_TYPE=debug LOG_LEVEL=debug DB_PORT=53306 SERVICE_PORT=58080 METRICS_PORT=51025 go run cmd/server/main.go & \
	SERVER_PID=$$!; \
	echo "Waiting for server to start..."; \
	sleep 2; \
	echo "Running service tests..."; \
	SERVICE_HOST=http://localhost:58080 METRICS_HOST=http://localhost:51025 go test ./test/stest -tags servicetest -v -count=1; \
	'
