# ---- Build stage (Node 22 slim) ----
FROM node:22-slim AS build
WORKDIR /app

# Tools for Prisma/bcrypt
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install deps (include dev for TypeScript/@types)
ENV NODE_ENV=development
COPY package*.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci || npm install

# Copy source
COPY src ./src

# Provide a dummy DB URL so `prisma generate` (Prisma 7) doesn't fail at build time
ARG DUMMY_DB_URL="postgresql://user:pass@localhost:5432/db?sslmode=disable"
ENV DATABASE_URL=$DUMMY_DB_URL

# Generate client and build
RUN npx prisma generate && npm run build

# ---- Runtime stage ----
FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# OpenSSL for Prisma at runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Only runtime artifacts
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY package*.json ./

EXPOSE 3000
# Runtime will use Railway's real DATABASE_URL and JWT_SECRET
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config=./prisma.config.ts && node dist/server.js"]
