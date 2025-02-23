.PHONY:  test build lint deps

build: servicetest.build
	@echo Building version: \"$(BIN_VER)\"
	env CGO_ENABLED=0 go build -ldflags='-X github.com/DenisPalnitsky/korty-wroclawia/api/cmd/version.Version=$(BIN_VER) -extldflags=-static' -o bin/api cmd/server/main.go

test:
	go test -v ./...

# Go lint
lint:
	golangci-lint run

deps:
	go install

clean:
	rm pb/gen/*.go

run:
	go run cmd/server/main.go

# service tests
servicetest.run:
	go test ./test/stest -tags servicetest  -v -count=1


servicetest.build:
	env CGO_ENABLED=0 go test ./test/stest -tags servicetest -v -c -o bin/service-test