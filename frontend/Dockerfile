# Multi-stage build for React frontend with Nginx
FROM node:24-bookworm AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install compatible pnpm version
RUN npm install -g pnpm@8.10.2

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN pnpm build

# Production stage with Nginx
FROM nginx:1.29.1-bookworm

# Remove default nginx configuration and copy our custom one
RUN rm -f /etc/nginx/conf.d/default.conf
COPY default.conf /etc/nginx/conf.d/default.conf

# Copy built application from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
