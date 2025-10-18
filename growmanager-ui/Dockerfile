# ============================================================
# Multi-stage Dockerfile for GrowManager UI (Production)
# ============================================================
# Stage 1: Build the React application with Vite
# Stage 2: Serve with Nginx
# ============================================================

# -----------------------------
# Stage 1: Build with Node.js
# -----------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies (cached layer)
COPY package*.json ./
RUN npm ci --only=production=false

# Copy source code and build
COPY . .
RUN npm run build

# -----------------------------
# Stage 2: Serve with Nginx
# -----------------------------
FROM nginx:1.25-alpine

# Add labels for metadata
LABEL maintainer="GrowManager Team"
LABEL description="GrowManager UI - React SPA"
LABEL version="1.0.0"

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]