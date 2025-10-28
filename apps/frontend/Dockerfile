FROM public.ecr.aws/docker/library/node:22-alpine
WORKDIR /app

COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && pnpm i

COPY . .
EXPOSE 4200
# Llamar al CLI directo (evita scripts intermedios)
CMD ["pnpm","ng","serve","--host","0.0.0.0","--port","4200"]
