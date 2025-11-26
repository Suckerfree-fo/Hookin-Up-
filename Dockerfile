# syntax=docker/dockerfile:1

FROM node:22-slim AS build
WORKDIR /app/backend
COPY backend/package*.json backend/tsconfig.json backend/prisma.config.ts backend/prisma/ ./
RUN npm ci --include=dev
COPY backend/src ./src
RUN npx prisma generate && npm run build

FROM node:22-slim AS runner
WORKDIR /app/backend
ENV NODE_ENV=production
# copy build artifacts + deps
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/prisma.config.ts ./prisma.config.ts
COPY --from=build /app/backend/prisma ./prisma
# start: run migrations (using local binary) then boot server
CMD ["bash","-lc","./node_modules/.bin/prisma migrate deploy --config=./prisma.config.ts || true; node dist/server.js"]
EXPOSE 3000
