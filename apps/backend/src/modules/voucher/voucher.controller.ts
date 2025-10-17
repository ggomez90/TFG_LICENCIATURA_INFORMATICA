import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { VoucherService } from './voucher.service';
import { CreateVoucherDto } from './create-voucher.dto';
import { UpdateEstadoVoucherDto } from './update-estado-voucher.dto';
import { FilterVoucherDto } from './filter-voucher.dto';

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  // =====================================================
  // Listado (login requerido) — ADMIN y CLIENTE
  // =====================================================
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
  async findAll(@User() user: any, @Query() filter: FilterVoucherDto) {
    const actorRole = this.pickRole(user); // 'ADMIN' | 'CLIENTE'
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherService.findAll(filter, { actorRole, identifier });
  }

  // =====================================================
  // Crear (login requerido) — ADMIN y CLIENTE
  // =====================================================
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
  async create(@User() user: any, @Body() dto: CreateVoucherDto) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherService.create(dto, { actorRole, identifier });
  }

  // =====================================================
  // Update-estado (login requerido) — ADMIN y CLIENTE
  // =====================================================
  @Patch(':id/estado')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CLIENTE')
  async updateEstado(
    @User() user: any,
    @Param('id', ParseIntPipe) idVoucher: number,
    @Body() dto: UpdateEstadoVoucherDto,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherService.updateEstado(idVoucher, dto, { actorRole, identifier });
  }

  // ---------------- helpers ----------------
  private pickRole(user: any): 'ADMIN' | 'CLIENTE' {
    const roles =
      user?.realm_access?.roles ??
      user?.resource_access?.default?.roles ??
      user?.roles ??
      [];
    if (Array.isArray(roles) && roles.includes('ADMIN')) return 'ADMIN';
    return 'CLIENTE'; // OPERARIO está excluido a nivel @Roles, por si acaso devolvemos CLIENTE por defecto
  }
}
