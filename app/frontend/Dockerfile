FROM node:20-alpine AS builder

WORKDIR /app

RUN mkdir -p /demo/gpl-stub-package && \
    printf '{"name":"demo-gpl-component","version":"1.0.0","description":"Stub package with GPL-3.0 license for Harness SCS policy demo","license":"GPL-3.0","main":"index.js"}\n' > /demo/gpl-stub-package/package.json && \
    printf '// Demo GPL-3.0 licensed component\nmodule.exports = { name: "demo-gpl-component", license: "GPL-3.0" };\n' > /demo/gpl-stub-package/index.js

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:1.25-alpine

LABEL org.opencontainers.image.title="supplywatch-frontend" \
      org.opencontainers.image.description="SupplyWatch Dashboard Frontend" \
      org.opencontainers.image.vendor="Harness SCS Demo" \
      org.opencontainers.image.version="1.0.0"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]