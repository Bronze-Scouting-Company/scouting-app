# ---- Build ----
FROM oven/bun:alpine AS builder
ENV NODE_ENV=production

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bunx --bun vite build  && chown 101:101 -R ./dist

# ---- Runtime ----
FROM nginx:1.29-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

RUN chown -R nginx:nginx /var/cache/nginx /run

USER nginx
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]