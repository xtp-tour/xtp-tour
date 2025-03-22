.PHONY:  test build lint deps linux-build

build: servicetest.build
	@echo Building version: \"$(BIN_VER)\"
	env CGO_ENABLED=0 go build -ldflags='-X github.com/xtp-tour/xtp-tour/api/cmd/version.Version=$(BIN_VER) -extldflags=-static' -o bin/api cmd/server/main.go

# Build for Linux target
linux-build:
	@echo Building for Linux, version: \"$(BIN_VER)\"
	env CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags='-X github.com/xtp-tour/xtp-tour/api/cmd/version.Version=$(BIN_VER) -extldflags=-static' -o bin/api cmd/server/main.go

test:
	go test -v ./...

# Go lint
lint:
	golangci-lint run

deps:
	go install

clean:
	rm -f bin/api bin/service-test

run:
	go run cmd/server/main.go

# Development mode with hot-reload
dev:
	air

gen-schemas:
	xo schema "mysql://root:password@127.0.0.1:33306/xtp_tour?parseTime=true&sql_mode=ansi"  -o pkg/db/model 

# service tests
servicetest.run:
	go test ./test/stest -tags servicetest  -v -count=1


servicetest.build:
	env CGO_ENABLED=0 go test ./test/stest -tags servicetest -v -c -o bin/service-test

# Docker build using the Linux target
docker-build: linux-build
	docker build -t xtp-tour-api -f Dockerfile .
	
# Run the Docker container
docker-run:
	docker run -p 8080:8080 -p 10250:10250 xtp-tour-api

	 