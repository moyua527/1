FROM node:22-alpine AS base
WORKDIR /app

# Backend dependencies
COPY server/duijie/package.json server/duijie/package-lock.json* ./server/duijie/
RUN cd server/duijie && npm ci --omit=dev

# Frontend build
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY frontend/duijieReact/package.json frontend/duijieReact/package-lock.json* ./frontend/duijieReact/
RUN cd frontend/duijieReact && npm ci
COPY frontend/duijieReact/ ./frontend/duijieReact/
RUN cd frontend/duijieReact && npx vite build

# Production
FROM node:22-alpine
WORKDIR /app

RUN addgroup -S duijie && adduser -S duijie -G duijie

COPY --from=base /app/server/duijie/node_modules ./server/duijie/node_modules
COPY server/duijie/ ./server/duijie/
COPY --from=frontend-build /app/frontend/duijieReact/dist ./frontend/duijieReact/dist

RUN mkdir -p server/duijie/uploads server/duijie/logs && \
    chown -R duijie:duijie /app

USER duijie

EXPOSE 1800

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:1800/api/health || exit 1

CMD ["node", "server/duijie/standalone.js"]
