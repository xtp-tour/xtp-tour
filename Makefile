.PHONY: backend frontend

backend:
	cd api && make linux-build BIN_VER=1.0.0

frontend:
	cd frontend && pnpm run build	

all: backend frontend
	docker build -t xtp-tour .
