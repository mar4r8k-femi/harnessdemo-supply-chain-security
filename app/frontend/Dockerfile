FROM node:20-alpine AS builder

WORKDIR /app

RUN mkdir -p /demo/gpl-stub-package && \
    printf '{"name":"demo-gpl-component","version":"1.0.0","description":"Stub package with GPL-3.0 license for Harness SCS policy demo","license":"GPL-3.0","main":"index.js"}\n' > /demo/gpl-stub-package/package.json && \
    printf '// Demo GPL-3.0 licensed component\nmodule.exports = { name: "demo-gpl-component", license: "GPL-3.0" };\n' > /demo/gpl-stub-package/index.js

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:1.25-alpine

LABEL org.opencontainers.image.title="supplywatch-frontend" \
      org.opencontainers.image.description="SupplyWatch Dashboard Frontend" \
      org.opencontainers.image.vendor="Harness SCS Demo" \
      org.opencontainers.image.version="1.0.0"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

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