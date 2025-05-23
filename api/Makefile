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

