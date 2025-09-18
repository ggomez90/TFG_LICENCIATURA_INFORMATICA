FROM node:22-alpine

WORKDIR /app

# Dependencias del sistema necesarias para Prisma en Alpine
RUN apk add --no-cache openssl

# Instalar deps
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm i

# Generar Prisma Client (necesita node_modules y prisma/)
COPY prisma ./prisma
RUN pnpm prisma generate

# Copiar el resto del código
COPY . .

EXPOSE 3000
CMD ["pnpm","start:dev"]
