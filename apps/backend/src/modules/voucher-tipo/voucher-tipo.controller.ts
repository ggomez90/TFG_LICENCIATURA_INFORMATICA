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
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { VoucherTipoService } from './voucher-tipo.service';
import { CreateVoucherTipoDto } from './create-voucher-tipo.dto';
import { UpdateVoucherTipoDto } from './update-voucher-tipo.dto';
import { UpdateActivaVoucherTipoDto } from './update-activa-voucher-tipo.dto';
import { FilterVoucherTipoDto } from './filter-voucher-tipo.dto';
import { FilterVoucherTipoClienteDto } from './filter-voucher-tipo-cliente.dto';

import { KeycloakAuthGuard, RolesGuard, Roles } from '../../auth';

@Controller('voucher-tipo')
export class VoucherTipoController {
  constructor(private readonly voucherTipoService: VoucherTipoService) {}

  // Solo ADMIN
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async findAll(@Query() filter: FilterVoucherTipoDto) {
    return this.voucherTipoService.findAll(filter);
  }

  //GET para cliente
  @Get('cliente/disponibles')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('CLIENTE')
  async findDisponiblesCliente(
    @Req() req: any,
    @Query() filter: FilterVoucherTipoClienteDto,
  ) {
    const user = req.user;
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherTipoService.findDisponiblesCliente(filter, { identifier });
  }

  @Get('cliente/disponibles/:id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('CLIENTE')
  async findOneDisponibleCliente(
    @Req() req: any,
    @Param('id', ParseIntPipe) idVoucherTipo: number,
  ) {
    const user = req.user;
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.voucherTipoService.findOneDisponibleCliente(idVoucherTipo, { identifier });
  }

  @Post()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateVoucherTipoDto) {
    // el DTO ya trae idAdmin desde el front
    return this.voucherTipoService.create(dto);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async update(
    @Param('id', ParseIntPipe) idVoucherTipo: number,
    @Body() dto: UpdateVoucherTipoDto,
  ) {
    return this.voucherTipoService.update(idVoucherTipo, dto);
  }

  @Patch(':id/activa')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async updateActiva(
    @Param('id', ParseIntPipe) idVoucherTipo: number,
    @Body() dto: UpdateActivaVoucherTipoDto,
  ) {
    return this.voucherTipoService.updateActiva(idVoucherTipo, dto);
  }

  @Get(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async findOne(@Param('id', ParseIntPipe) idVoucherTipo: number) {
    return this.voucherTipoService.findOne(idVoucherTipo);
  }
}
