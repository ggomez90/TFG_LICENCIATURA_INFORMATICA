import { Module } from '@nestjs/common';
import { LocalidadService } from './localidad.service';
import { LocalidadController } from './localidad.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LocalidadController],
  providers: [LocalidadService],
  exports: [LocalidadService],
})
export class LocalidadModule {}
