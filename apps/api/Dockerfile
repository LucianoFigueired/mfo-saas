# STAGE 1: Pruner
FROM node:20-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo
COPY . .
RUN turbo prune @mfo/api --docker

# STAGE 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
RUN npm install -g pnpm turbo

# 1. Setup inicial
COPY --from=pruner /app/out/full/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

# 2. Instalação para Build (com links)
RUN pnpm install --frozen-lockfile

# 3. Hack ENV para o Prisma Generate
RUN echo "DATABASE_URL=postgresql://build:build@localhost:5432/build_db" > packages/database/.env

# 4. Build da API
RUN pnpm turbo build --filter=@mfo/api...

# --- PREPARAÇÃO DO PACOTE DATABASE (Já resolvido) ---
RUN echo "module.exports = require('./generated/client');" > packages/database/index.js
RUN sed -i 's/"main": "index.ts"/"main": "index.js"/g' packages/database/package.json

# --- PREPARAÇÃO DO PACOTE COMMON (NOVO) ---
# Como o common tem código Zod, precisamos transformar TS em JS.
# Usamos o tsc (TypeScript Compiler) que já foi instalado no pnpm install.
RUN cd packages/common && \
    ../..//node_modules/.bin/tsc index.ts --target es2019 --module commonjs --esModuleInterop --skipLibCheck

# Ajustamos o package.json do common para apontar para o novo arquivo .js
RUN sed -i 's/"main": ".\/index.ts"/"main": ".\/index.js"/g' packages/common/package.json


# STAGE 3: Prod Deps
FROM node:20-alpine AS prod-deps
WORKDIR /app
RUN npm install -g pnpm
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN echo "node-linker=hoisted" > .npmrc
RUN pnpm install --prod --frozen-lockfile

# STAGE 4: Runner
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
USER nestjs

# 1. Copiamos o código da API
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/package.json

# 2. Copiamos as dependências (Node Modules)
COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules

# 3. Copiamos o pacote DATABASE preparado
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/generated ./node_modules/@mfo/database/generated
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/package.json ./node_modules/@mfo/database/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/index.js ./node_modules/@mfo/database/index.js

# 4. --- CORREÇÃO COMMON (NOVO) ---
# Copiamos o pacote common compilado (JS) para dentro de node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/common/index.js ./node_modules/@mfo/common/index.js
COPY --from=builder --chown=nestjs:nodejs /app/packages/common/package.json ./node_modules/@mfo/common/package.json

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]