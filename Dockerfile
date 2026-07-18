# syntax=docker/dockerfile:1

# ═══════════════════════════════════════════════════════════════════════════════
# Production Dockerfile — Multi-stage build for Fleet Management SaaS
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Stage 1: deps ────────────────────────────────────────────────────────────
# Install only production dependencies with aggressive layer caching
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl curl
WORKDIR /app

COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev && npm cache clean --force

# ─── Stage 2: builder ─────────────────────────────────────────────────────────
# Build the Next.js app with all dev dependencies + Prisma generation
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy package files first for cache layer
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy Prisma schema and generate client before full source
COPY prisma ./prisma/
RUN npx prisma generate

# Copy remaining source and build
COPY . .
ENV NODE_ENV=production
RUN npm run build

# ─── Stage 3: runner ────────────────────────────────────────────────────────
# Minimal production image — only runtime artifacts, non-root user
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl curl
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone Next.js build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy Prisma schema, generated client, and engine binaries for runtime DB ops
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma/
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma/

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
