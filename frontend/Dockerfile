# Multi-stage build for React frontend with Nginx
FROM node:24-bookworm AS builder

# Set working directory
WORKDIR /app

# Install compatible pnpm version
RUN npm install -g pnpm@10.15.1

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Accept build arguments
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_API_BASE_URL
ARG VITE_APP_VERSION

# Set environment variables for build
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION

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
