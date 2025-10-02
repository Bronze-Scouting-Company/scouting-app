# ---- Stage de Développement ----
FROM oven/bun:alpine AS development
ENV NODE_ENV=development

WORKDIR /app

COPY package.json ./
COPY bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["bun", "run", "dev", "--host"]


# ---- Stage de Build (pour la production) ----
FROM oven/bun:alpine AS builder
ENV NODE_ENV=production

WORKDIR /app

COPY package.json ./
COPY src ./

RUN bun install

COPY . .

RUN bunx --bun vite build  


# ---- Stage de Production ----
FROM nginx:1.25-alpine AS production

# Copie des fichiers buildés
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
