.PHONY: start-backend start-frontend start

start-backend:
	cd ../api && make run

start-frontend:
	pnpm dev
update-api-schema:
	pnpm generate-types

run:
	make start-backend & make start-frontend