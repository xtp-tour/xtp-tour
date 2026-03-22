.PHONY:  test build lint deps

# Keep in sync with .github/workflows/backend.yaml (golangci-lint-action version).
GOLANGCI_LINT_VERSION ?= v2.0.0

build: servicetest.build
	@echo Building version: \"$(BIN_VER)\"
	$(MAKE) build-binary

# ARM build target
build-arm: servicetest.build
	@echo Building version: \"$(BIN_VER)\"
	$(MAKE) build-binary GOARCH=arm64

# Reusable build command
build-binary:
	env CGO_ENABLED=0 $(if $(GOARCH),GOARCH=$(GOARCH),) go build -ldflags='-X github.com/xtp-tour/xtp-tour/api/cmd/version.Version=$(BIN_VER) -extldflags=-static' -o bin/api cmd/server/main.go


migrate:
	go run ./... migrate

dbreset:
	@echo "WARNING: This will completely destroy your database and all data!"
	mysql -h 127.0.0.1 -P 33306 -u root --password="password" -e "DROP DATABASE xtp_tour;"
	go run ./... migrate

test:
	go test -v ./...

# Go lint (pinned version so local results match CI; `golangci-lint` in PATH is not used)
lint:
	go run github.com/golangci/golangci-lint/v2/cmd/golangci-lint@$(GOLANGCI_LINT_VERSION) run

deps:
	go install github.com/xo/xo@latest

clean:
	rm pb/gen/*.go

run:
	go run cmd/server/main.go

# Development mode with hot-reload
dev:
	AUTH_TYPE=debug LOG_LEVEL=debug air

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

# runs service tests against local database (see scripts/run-service-tests.sh)
str:
	@bash scripts/run-service-tests.sh
