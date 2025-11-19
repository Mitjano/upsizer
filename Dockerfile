# Dockerfile for Pixelift Enterprise API
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install sharp dependencies for Alpine Linux
RUN apk add --no-cache \
    libc6-compat \
    vips-dev \
    build-base \
    python3 \
    pkgconfig
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Install runtime dependencies for sharp
RUN apk add --no-cache vips-dev

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy API routes (not included in standalone by default)
COPY --from=builder --chown=nextjs:nodejs /app/app ./app

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]
