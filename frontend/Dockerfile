# ---- Build ----
FROM oven/bun:alpine AS builder
ARG VITE_NODE_ENV=production
ARG VITE_APP_ORIGIN=""
ARG VITE_S3_ENDPOINT=""
ARG VITE_S3_REGION=""
ARG VITE_S3_BUCKET=""

ENV NODE_ENV=${VITE_NODE_ENV}

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN cat > .env.production <<EOF
VITE_NODE_ENV=${VITE_NODE_ENV}
VITE_APP_ORIGIN=${VITE_APP_ORIGIN}
VITE_S3_ENDPOINT=${VITE_S3_ENDPOINT}
VITE_S3_REGION=${VITE_S3_REGION}
VITE_S3_BUCKET=${VITE_S3_BUCKET}
EOF

RUN bunx --bun vite build  && chown 101:101 -R ./dist

# ---- Runtime ----
FROM nginx:1.29-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /var/cache/nginx /run

USER nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]