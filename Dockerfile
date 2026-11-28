FROM node:20-slim AS builder

WORKDIR /app

# Instalação do pnpm e dependências necessárias para compilação nativa
RUN npm install -g pnpm@12.23.0
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copia arquivos de configuração do monorepo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Instala dependências do workspace e da API
RUN pnpm install --frozen-lockfile

# Gera o Prisma Client
WORKDIR /app/apps/api
RUN pnpm exec prisma generate

# Compila o NestJS
RUN pnpm run build

# Stage de Produção (Imagem final enxuta)
FROM node:20-slim AS runner

WORKDIR /app
RUN npm install -g pnpm@12.23.0
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app /app

WORKDIR /app/apps/api

EXPOSE 3000

# Executa migrações do Prisma no banco em nuvem e inicia a API
CMD ["sh", "-c", "npx prisma db push --skip-generate && node dist/main.js"]
