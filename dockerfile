# ── Stage 1: Install dependencies ────────────────────────────────
# Separate stage just for deps because of Prisma's postinstall hook.
# `npm ci` triggers `prisma generate` automatically (your postinstall script).
# Prisma generate reads prisma/schema.prisma and creates the typed client.
# If we tried to do this inside the builder stage, it can fail because
# Prisma needs the schema file present before generate runs.
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

# postinstall runs `prisma generate` here automatically
RUN npm ci

# ── Stage 2: Build ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Pull installed node_modules (with generated Prisma client) from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* variables get baked into the JS bundle at build time.
# They are NOT available from process.env at runtime — Next.js inlines them
# during `next build`. So we pass them as build ARGs here.
# Other secrets (DATABASE_URL, JWT_SECRET etc.) are runtime-only — they go
# in your .env.production file on EC2 and are passed via `env_file` in compose.
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=$NEXT_PUBLIC_SOCKET_URL

RUN npm run build
# After this, .next/standalone/ contains a self-contained server
# .next/static/ contains the client-side JS/CSS chunks

# ── Stage 3: Production runner ───────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Security best practice: don't run as root inside the container.
# If someone exploits your app, they get a nobody user with no permissions,
# not root access to the container filesystem.
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the public folder (your static assets — images, icons etc.)
COPY --from=builder /app/public ./public

# Copy the standalone output — this is the trimmed self-contained server.
# --chown sets the file owner to the nextjs user we created above.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy static assets (CSS, JS chunks). standalone doesn't include these —
# they're served separately.
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# standalone output generates a server.js at the root
CMD ["node", "server.js"]