import { Module } from '@nestjs/common';
import { DesafioController } from './desafio.controller';
import { DesafioService } from './desafio.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [DesafioController],
  providers: [DesafioService, PrismaService],
  exports: [DesafioService],
})
export class DesafioModule {}
