.PHONY: backend frontend

backend:
	cd api
	go run cmd/server/main.go

frontend:
	cd frontend
	pnpm run dev
