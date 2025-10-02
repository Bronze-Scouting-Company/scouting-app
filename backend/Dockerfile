# ---- Stage de Développement ----
FROM oven/bun:alpine AS development
ENV NODE_ENV=development

WORKDIR /app

COPY package.json ./
COPY src ./

RUN bun install

COPY . .

EXPOSE 3000 

CMD ["bun", "run", "dev"]

# ---- Stage de Build (pour la production) ----

FROM oven/bun:alpine AS builder
ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./

RUN bun install

COPY . .

RUN bun build src/index.ts --compile --outfile server
RUN ls -l

# ---- Stage de Production ----
FROM alpine:3.19 AS production

WORKDIR /app

RUN apk add --no-cache libstdc++ libgcc dumb-init

COPY --from=builder /app/server /app/server

RUN chmod +x ./server

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

CMD ["./server"]

