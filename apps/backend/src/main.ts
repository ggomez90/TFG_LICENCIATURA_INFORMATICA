import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  //prefijo global para la API (todo el front que llama a /api/... + modulo)
  app.setGlobalPrefix('api');

  // frontend Angular / Nginx
  const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN?.trim();

  const allowedOrigins = [
    'http://localhost',      // Nginx sirviendo el front (puerto 80)
    'http://localhost:80',   // por las dudas
    'http://localhost:4200', // Angular dev
    'http://127.0.0.1:4200', // tambien con ip, por las dudas
  ];

  if (FRONTEND_ORIGIN) {
    allowedOrigins.push(FRONTEND_ORIGIN);
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir sin origen (para pruebas postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

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
      whitelist: true,            // elimina campos no declarados en DTO
      forbidNonWhitelisted: true, // lanza error si llegan campos no permitidos
      transform: true,            // convierte tipos automaticamente
    }),
  );

  // Servidor backend
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port, '0.0.0.0'); // importante en Docker
  //msjs para marcar el correcto arranque del back
  console.log('✅ Backend escuchando en http://localhost:${port}');
  console.log('✅ API disponible en http://localhost:${port}/api');
}

bootstrap();
