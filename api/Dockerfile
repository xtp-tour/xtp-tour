FROM alpine:latest

# Install necessary runtime dependencies
RUN apk --no-cache add ca-certificates

# Create app directory
WORKDIR /app

# Copy the pre-built binary
COPY bin/api /app/server

# Copy any config files needed
COPY service_test.yaml* /app/

# Create a non-root user to run the application
RUN adduser -D -g '' appuser
USER appuser

# Expose ports
EXPOSE 8080
EXPOSE 10250

# Set environment variables
ENV GIN_MODE=release

# Run the server
CMD ["/app/server"]