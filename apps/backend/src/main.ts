import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // frontend Angular en localhost:4200 y 127.0.0.1:4200
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN?.trim();
  const allowedOrigins = [
    'http://localhost:4200',
    'http://127.0.0.1:4200',
  ];
  if (FRONTEND_ORIGIN) allowedOrigins.push(FRONTEND_ORIGIN);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir sin origen (Postman o cURL)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn(`CORS bloqueado para origen no permitido: ${origin}`);
      return callback(new Error('CORS no permitido para este origen'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
  });

  // Validacion global DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // elimina campos no declarados en DTO
      forbidNonWhitelisted: true, // lanza error si llegan campos no permitidos
      transform: true,           // convierte tipos automáticamente
    }),
  );

  // Servidor backend
const port = process.env.PORT ? Number(process.env.PORT) : 3000;
await app.listen(port, '0.0.0.0');  // importante en Docker
console.log(`✅ Backend escuchando en http://localhost:${port}`);
}

bootstrap();
