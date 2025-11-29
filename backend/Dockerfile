# ---- Build stage (Node 22 slim) ----
FROM node:22-slim AS build
WORKDIR /app
ENV NODE_ENV=production

# Tools for Prisma/bcrypt
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install deps
COPY package*.json tsconfig.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm install

# Copy source and build
COPY src ./src
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
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config=./prisma.config.ts && node dist/server.js"]
