FROM oven/bun:alpine AS builder
ENV NODE_ENV=production

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile --production

COPY . .

RUN bun build src/index.ts --compile --minify --outfile server

FROM alpine:3.21

RUN apk add --no-cache libstdc++ libc6-compat
RUN addgroup -S alpine && adduser -S alpine -G alpine

COPY --from=builder /app/server /app/server

RUN chown -R alpine:alpine /app && chmod +x /app/server

USER alpine

CMD ["/app/server"]

