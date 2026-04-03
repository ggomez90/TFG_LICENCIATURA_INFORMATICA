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
import { UpdateVoucherDto } from './update-voucher.dto';
import { AdquirirVoucherClienteDto } from './adquirir-voucher-cliente.dto';

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('vouchers')
export class VoucherController {
  constructor(private readonly voucherService: VoucherService) {}

  // Listado (login requerido) — ADMIN y CLIENTE
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'CLIENTE')
  async findAll(@User() user: any, @Query() filter: FilterVoucherDto) {
    const actorRole = this.pickRole(user); // ADMIN o CLIENTE
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherService.findAll(filter, { actorRole, identifier });
  }

  @Get('existe-tipo/:idVoucherTipo')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async existsByTipo(
    @Param('idVoucherTipo', ParseIntPipe) idVoucherTipo: number,
  ) {
    const exists = await this.voucherService.existsForTipo(idVoucherTipo);
    return { exists }; // { exists: true o false }
  }

  // Obtener por id (login requerido) — ADMIN y CLIENTE
  @Get(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'CLIENTE')
  async findOne(
    @User() user: any,
    @Param('id', ParseIntPipe) idVoucher: number,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherService.findOne(idVoucher, { actorRole, identifier });
  }


  // Crear (login requerido) — ADMIN y CLIENTE
  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'CLIENTE')
  async create(@User() user: any, @Body() dto: CreateVoucherDto) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherService.create(dto, { actorRole, identifier });
  }

  // Update-estado (login requerido) — ADMIN y CLIENTE
  @Patch(':id/estado')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'CLIENTE')
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

  //para cliente
  @Post('cliente/adquirir')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('CLIENTE')
  async adquirirCliente(
    @User() user: any,
    @Body() dto: AdquirirVoucherClienteDto,
  ) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherService.adquirirVoucherCliente(dto, {
      actorRole: 'CLIENTE',
      identifier,
    });
  }

  @Post(':id/cliente/anular')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('CLIENTE')
  async anularCliente(
    @User() user: any,
    @Param('id', ParseIntPipe) idVoucher: number,
  ) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherService.anularVoucherCliente(idVoucher, {
      actorRole: 'CLIENTE',
      identifier,
    });
  }

  // Editar voucher por id (login requerido) — ADMIN y CLIENTE
  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR', 'CLIENTE')
  async update(
    @User() user: any,
    @Param('id', ParseIntPipe) idVoucher: number,
    @Body() dto: UpdateVoucherDto,
  ) {
    const actorRole = this.pickRole(user);
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherService.update(idVoucher, dto, { actorRole, identifier });
  }

  // helpers
  private pickRole(user: any): 'ADMIN' | 'CLIENTE' {
    const roles: string[] =
      user?.realm_access?.roles ??
      user?.resource_access?.default?.roles ??
      user?.roles ??
      [];

    // ACEPTAR ADMIN o ADMINISTRADOR como rol de administración
    const up = roles.map(r => (r ?? '').toString().toUpperCase());
    if (up.includes('ADMIN') || up.includes('ADMINISTRADOR')) {
      return 'ADMIN';
    }

    return 'CLIENTE';
  }
}
