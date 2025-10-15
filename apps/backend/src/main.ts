import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // elimina campos no declarados en DTO
      forbidNonWhitelisted: true, // lanza error si llegan campos no permitidos
      transform: true, // convierte tipos automáticamente (string → number, etc.)
    }),
  );

  await app.listen(3000);
}
bootstrap();
