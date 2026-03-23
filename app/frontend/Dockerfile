# Stage 1: Build React app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy the GPL stub package (local file: dependency)
COPY demo/gpl-stub-package /demo/gpl-stub-package

COPY app/frontend/package.json ./
RUN npm install

COPY app/frontend/ .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:1.25-alpine

LABEL org.opencontainers.image.title="supplywatch-frontend" \
      org.opencontainers.image.description="SupplyWatch Dashboard Frontend" \
      org.opencontainers.image.vendor="Harness SCS Demo" \
      org.opencontainers.image.version="1.0.0"

COPY app/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

# Make dirs writable by nginx user for non-root operation
RUN mkdir -p /var/cache/nginx/client_temp /var/cache/nginx/proxy_temp \
             /var/cache/nginx/fastcgi_temp /var/cache/nginx/uwsgi_temp \
             /var/cache/nginx/scgi_temp /tmp/nginx && \
    chown -R nginx:nginx /var/cache/nginx /var/log/nginx /tmp/nginx && \
    sed -i 's|/var/run/nginx.pid|/tmp/nginx/nginx.pid|' /etc/nginx/nginx.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

USER nginx

CMD ["nginx", "-g", "daemon off;"]
