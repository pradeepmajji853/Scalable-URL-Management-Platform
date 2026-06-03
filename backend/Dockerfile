# =============================================================================
# Stage 1: Build the TypeScript application
# =============================================================================
FROM node:20-alpine AS build

WORKDIR /app

# Copy dependency manifests first for Docker layer caching
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for TypeScript compilation)
RUN npm ci --silent

# Copy application source code
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# =============================================================================
# Stage 2: Production runtime
# =============================================================================
FROM node:20-slim AS production

# Set production environment
ENV NODE_ENV=production

WORKDIR /app

# Install dumb-init for proper signal handling and wget for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init wget \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests
COPY package.json package-lock.json ./

# Install production-only dependencies
RUN npm ci --omit=dev --silent && npm cache clean --force

# Copy compiled JavaScript from build stage
COPY --from=build /app/dist ./dist

# Create non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser -d /app -s /sbin/nologin appuser \
    && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose the application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

# Use dumb-init to handle PID 1 and signal forwarding
CMD ["dumb-init", "node", "dist/server.js"]
