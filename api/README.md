# Rest Service Boilerplate



# Local development


You will need:
- Golang
- [sqlc](https://docs.sqlc.dev/en/stable/overview/install.html)
- [Go migrate cli](https://github.com/golang-migrate/migrate#cli-usage)

## Migrations

- Create new migration `migrate create -ext sql -dir db/migrations -seq <migration-name>`

## Google Calendar Integration

Create a new Google Cloud project and enable the Google Calendar API.

Create a new OAuth client ID and set the redirect URL to `http://localhost:5173/calendar/callback`.

Set environment variables:
```bash
export GOOGLE_CALENDAR_CLIENT_ID="your-client-id"
export GOOGLE_CALENDAR_CLIENT_SECRET="your-client-secret"
export GOOGLE_CALENDAR_REDIRECT_URL="http://localhost:5173/calendar/callback"
export TOKEN_ENCRYPTION_KEY=$(openssl rand -base64 32)
```

Endpoints: `/api/calendar/*` - OAuth flow, connection status, busy times, preferences.



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

