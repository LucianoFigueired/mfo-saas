FROM node:20-slim

# Instalar dependências necessárias para o Prisma e Turbo
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

# Instalar PNPM globalmente
RUN npm install -g pnpm

WORKDIR /app

# Copiar arquivos de configuração de dependências
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/database/package.json ./packages/database/
COPY packages/common/package.json ./packages/common/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Instalar dependências ignorando scripts (para evitar builds prematuros)
RUN pnpm install --frozen-lockfile

# Copiar o restante do código
COPY . .

# Gerar o Prisma Client dentro do container
RUN pnpm --filter @mfo/database exec prisma generate

EXPOSE 3000 9229

# O comando final será gerenciado pelo Docker Compose para garantir flexibilidade
CMD ["pnpm", "turbo", "run", "dev", "--filter=@mfo/api"]