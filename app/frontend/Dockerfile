# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine

LABEL org.opencontainers.image.title="supplywatch-frontend" \
      org.opencontainers.image.description="SupplyWatch Dashboard Frontend" \
      org.opencontainers.image.vendor="Harness SCS Demo" \
      org.opencontainers.image.version="1.0.0"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

USER nginx

CMD ["nginx", "-g", "daemon off;"]
