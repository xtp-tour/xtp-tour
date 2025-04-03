.PHONY:  test build lint deps

build: servicetest.build
	@echo Building version: \"$(BIN_VER)\"
	env CGO_ENABLED=0 go build -ldflags='-X github.com/xtp-tour/xtp-tour/api/cmd/version.Version=$(BIN_VER) -extldflags=-static' -o bin/api cmd/server/main.go

migrate:
	go run ./... migrate

test:
	go test -v ./...

# Go lint
lint:
	golangci-lint run

deps:
	go install github.com/stephenafamo/bob/cmd/bob@latest

clean:
	rm pb/gen/*.go

run:
	go run cmd/server/main.go

# Development mode with hot-reload
dev:
	air

gen-schemas:
	go run ./... migrate
	cd pkg/db && MYSQL_DSN='root:password@tcp(127.0.0.1:33306)/xtp_tour?parseTime=true' go run github.com/stephenafamo/bob/gen/bobgen-mysql@v0.31.0


# service tests
servicetest.run:
	go test ./test/stest -tags servicetest  -v -count=1


servicetest.build:
	env CGO_ENABLED=0 go test ./test/stest -tags servicetest -v -c -o bin/service-test

