# =============================================================================
# Stage 1: Build the React application
# =============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests first for Docker layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --silent

# Copy application source code
COPY . .

# Build the production bundle
RUN npm run build

# =============================================================================
# Stage 2: Serve with Nginx
# =============================================================================
FROM nginx:alpine AS production

# Remove default nginx configuration
RUN rm -rf /etc/nginx/conf.d/default.conf

# Copy custom nginx configuration for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health || exit 1

# Start nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
