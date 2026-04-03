import { Module } from '@nestjs/common';
import { ProvinciaController } from './provincia.controller';
import { ProvinciaService } from './provincia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProvinciaController],
  providers: [ProvinciaService, PrismaService],
  exports: [ProvinciaService],
})
export class ProvinciaModule {}
