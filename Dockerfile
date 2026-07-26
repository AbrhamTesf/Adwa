# ---- Base — installs root (orchestration), frontend/, and backend/ deps ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package.json ./
COPY frontend/package.json ./frontend/package.json
COPY backend/package.json ./backend/package.json
RUN npm install
RUN npm --prefix frontend install
RUN npm --prefix backend install

# ---- Dev image (client + server via concurrently, respects frontend/backend/) ----
FROM base AS dev
COPY . .
EXPOSE 5173 8787
CMD ["npm", "run", "dev:all"]

# ---- Build (client only, output stays inside frontend/dist) ----
FROM base AS build
COPY . .
RUN npm run build

# ---- Production (static client served by fastify from backend/) ----
FROM node:20-alpine AS prod
WORKDIR /app
# The backend sources are copied before installing because the install runs
# `prisma generate`, which needs prisma/schema.prisma to already be present.
COPY backend ./backend
RUN npm --prefix backend install --omit=dev
COPY --from=build /app/frontend/dist ./frontend/dist
COPY frontend/public ./frontend/public
EXPOSE 8787
ENV NODE_ENV=production
CMD ["node", "backend/index.js"]
