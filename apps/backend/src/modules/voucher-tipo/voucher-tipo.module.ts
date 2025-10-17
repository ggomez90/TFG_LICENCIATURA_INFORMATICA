import { Module } from '@nestjs/common';
import { VoucherTipoController } from './voucher-tipo.controller';
import { VoucherTipoService } from './voucher-tipo.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [VoucherTipoController],
  providers: [VoucherTipoService, PrismaService],
  exports: [VoucherTipoService],
})
export class VoucherTipoModule {}
