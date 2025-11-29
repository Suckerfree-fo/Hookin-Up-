# -------- Multi-stage Dockerfile (Node 22 + Prisma 7) for backend/ context --------
# Build
FROM node:22-alpine AS build
WORKDIR /app
ENV NODE_ENV=production
# Needed for Prisma and native addons (e.g., bcrypt)
RUN apk add --no-cache openssl python3 make g++

# deps
COPY package*.json ./
RUN npm ci

# prisma + config (Prisma 7: url via prisma.config.ts)
COPY prisma ./prisma
COPY prisma.config.ts ./

# source
COPY . .

# build TS -> dist
RUN npm run build

# Runtime
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/package*.json ./

EXPOSE 3000
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy --config=./prisma.config.ts && node dist/server.js"]
