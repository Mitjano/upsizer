# Dockerfile for Pixelift Enterprise API
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install sharp dependencies for Alpine Linux and OpenSSL for Prisma
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    build-base \
    python3 \
    pkgconfig \
    openssl
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
# Set dummy DATABASE_URL for prisma generate during build (not used at runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set dummy DATABASE_URL for prisma generate during build
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
# Generate Prisma client and build Next.js with increased memory limit
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN npx prisma generate && npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Install runtime dependencies for sharp and Prisma
RUN apk add --no-cache vips-dev openssl

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy Prisma schema for migrations (optional, needed if running migrations in container)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./
# Copy generated Prisma client
COPY --from=builder --chown=nextjs:nodejs /app/lib/generated ./lib/generated

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
