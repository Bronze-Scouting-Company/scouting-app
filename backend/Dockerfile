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
COPY src ./

RUN bun install

COPY . .

RUN ls -l
RUN bun build src/index.ts --compile --outfile server

# ---- Stage de Production ----
FROM alpine:3.19 AS production 

COPY --from=builder /app/server /app/server

RUN chmod +x /app/server

CMD ["/app/server"]

