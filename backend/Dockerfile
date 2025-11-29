# syntax=docker/dockerfile:1

FROM node:22-slim AS build
WORKDIR /app/backend

# Copy backend package + config + prisma files from repo root context
COPY backend/package*.json backend/tsconfig.json backend/prisma.config.ts backend/prisma/ ./

# Install all deps (including dev) for build
RUN npm ci --include=dev

# Copy backend source
COPY backend/src ./src

# Build app and run migrations in the BUILD stage
RUN npx prisma generate && npm run build && npx prisma migrate deploy --config=./prisma.config.ts

# ----- Runtime stage -----
FROM node:22-slim AS runner
WORKDIR /app/backend
ENV NODE_ENV=production

# Copy build artifacts + deps from build stage
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/backend/prisma ./prisma

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
ENTRYPOINT ["dumb-init","--"]
CMD ["node","dist/server.js"]
