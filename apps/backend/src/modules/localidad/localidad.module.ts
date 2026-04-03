import { Module } from '@nestjs/common';
import { LocalidadService } from './localidad.service';
import { LocalidadController } from './localidad.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../../auth';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LocalidadController],
  providers: [LocalidadService],
  exports: [LocalidadService],
})
export class LocalidadModule {}
