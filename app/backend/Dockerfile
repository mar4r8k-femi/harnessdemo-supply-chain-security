# Stage 1: Build and test
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm test

# Stage 2: Production image
FROM node:20-alpine

LABEL org.opencontainers.image.title="supplywatch-backend" \
      org.opencontainers.image.description="SupplyWatch Backend API Server" \
      org.opencontainers.image.vendor="Harness SCS Demo" \
      org.opencontainers.image.version="1.0.0"

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY src/ ./src/

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/health || exit 1

USER node

CMD ["node", "src/index.js"]
