# Rest Service Boilerplate



# Local development

## Migrations

- Create new migration `migrate create -ext sql -dir db/migrations -seq <migration-name>`



# :computer: Useful commands

- run unit tests `go test ./... -v`
- run server `go run cmd/server/main.go` 
- run service tests from another terminal `go test ./test/stest -tags servicetest  -v -count=1`
- Send PUT request:
```
        curl -X 'PUT' 'http://localhost:8080/things/first-thing' \
        -d '{ "value": "thing value" }'  
```
- Send GET request 
```
        curl 'http://localhost:8080/things/first-thing'
```
- Swagger `http://localhost:8080/swagger`
- Open API spec `http://localhost:8080/openapi.json`
- Prometheus metrics `http://localhost:10250/metrics`

