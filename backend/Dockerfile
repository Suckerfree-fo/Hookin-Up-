# syntax=docker/dockerfile:1

FROM node:22-slim AS build
WORKDIR /app/backend

# Copy package/config files
COPY backend/package*.json backend/tsconfig.json backend/prisma.config.ts ./

# Copy prisma directory into /app/backend/prisma
COPY backend/prisma ./prisma


# Install all deps (including dev) for build
RUN npm install

# Copy backend source
COPY backend/src ./src

# Provide a dummy DATABASE_URL so prisma.config.ts can load
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"

# Build app (generate client + compile TS)
RUN npx prisma generate && npm run build

# ----- Runtime stage -----
FROM node:22-slim AS runner
WORKDIR /app/backend
ENV NODE_ENV=production

# Copy build artifacts + deps from build stage
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/backend/prisma ./prisma

# Run migrations using local Prisma binary, then start server
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy --config=./prisma.config.ts || true; node dist/server.js"]

EXPOSE 3000
