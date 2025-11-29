# ---- Build stage (Node 22 slim, repo-root context) ----
FROM node:22-slim AS build
WORKDIR /app/backend
ENV NODE_ENV=production

# Tools needed for Prisma/bcrypt
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install deps for backend
COPY backend/package*.json backend/tsconfig.json backend/prisma.config.ts ./
COPY backend/prisma ./prisma
RUN npm install

# Copy source and build
COPY backend/src ./src
RUN npx prisma generate && npm run build

# ---- Runtime stage ----
FROM node:22-slim AS runner
WORKDIR /app/backend
ENV NODE_ENV=production

# OpenSSL for Prisma runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Only runtime artifacts
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/backend/prisma ./prisma
COPY backend/package*.json ./

EXPOSE 3000
# Prisma 7 migrate via prisma.config.ts, then start app
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config=./prisma.config.ts && node dist/server.js"]
