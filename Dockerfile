# ==============================================================================
# RALOA Multi-Stage Production Dockerfile
# ==============================================================================

# --- Stage 1: Build & Native Compilation ---
FROM node:22-alpine AS builder

WORKDIR /app

# Install native build tools for compiling better-sqlite3 C++ bindings
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci

# Copy source files
COPY tsconfig.json vite.config.ts index.html ./
COPY src/ ./src/
COPY public/ ./public/
COPY server/ ./server/
COPY scripts/ ./scripts/
COPY shared/ ./shared/

# Build client SPA assets into dist/ and compiled server into dist-server/
RUN npm run build

# Prune devDependencies to keep image lean
RUN npm prune --production

# --- Stage 2: Production Execution Image ---
FROM node:22-alpine AS runner

WORKDIR /app

# Install tini for clean signal handling (SIGTERM, SIGINT) and curl for healthchecks
RUN apk add --no-cache tini curl

ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules from builder (including compiled native SQLite bindings)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/public ./public

# Create data and uploads directories
RUN mkdir -p /app/data /app/public/uploads

# Persistent volumes for database and uploaded media
VOLUME ["/app/data", "/app/public/uploads"]

EXPOSE 3000

# Health check against live endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "start"]
