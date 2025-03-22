FROM ubuntu:24.04
RUN apt-get update && apt-get install -y mysql-server && apt-get clean

COPY api/bin/api /app/api
COPY frontend/dist /app/frontend/dist/assets

# Set environment variables
ENV GIN_MODE=release
ENV DB_HOST=127.0.0.1
ENV DB_PORT=3306
ENV DB_USER=root
ENV DB_PASSWORD=xtp_tour_secret_password
ENV DB_NAME=xtp_tour

ENV GIN_MODE=release
ENV DB_NAME=xtp_tour

WORKDIR /app

# Set up MySQL to start with container
COPY docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

CMD ["/app/docker-entrypoint.sh", "/app/api"]