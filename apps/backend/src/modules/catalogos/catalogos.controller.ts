import {
  Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { CatalogosService } from './catalogos.service';
import { AuthGuard, RolesGuard } from '../../auth';
import { Roles } from '../../auth/roles.decorator';

// Import DTO de cada catálogo
import { CreateEstadoDesafioDto, UpdateEstadoDesafioDto, FilterEstadoDesafioDto } from './estado-desafio.dto';
import { CreateEstadoEntregaDto, UpdateEstadoEntregaDto, FilterEstadoEntregaDto } from './estado-entrega.dto';
import { CreateEstadoUsuarioDto, UpdateEstadoUsuarioDto, FilterEstadoUsuarioDto } from './estado-usuario.dto';
import { CreateEstadoVoucherDto, UpdateEstadoVoucherDto, FilterEstadoVoucherDto } from './estado-voucher.dto';
import { CreateRolUsuarioDto, UpdateRolUsuarioDto, FilterRolUsuarioDto } from './rol-usuario.dto';
import { CreateTipoMovimientoDto, UpdateTipoMovimientoDto, FilterTipoMovimientoDto } from './tipo-movimiento.dto';
import { CreateOrigenMovimientoDto, UpdateOrigenMovimientoDto, FilterOrigenMovimientoDto } from './origen-movimiento.dto';

@UseGuards(AuthGuard, RolesGuard)
@Controller('catalogos')
export class CatalogosController {
  constructor(private readonly service: CatalogosService) {}

  // EstadoDesafio
  @Get('estado-desafio')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  listEstadoDesafio(@Query() q: FilterEstadoDesafioDto) {
    return this.service.listEstadoDesafio(q);
  }

  @Get('estado-desafio/:id')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  getEstadoDesafio(@Param('id', ParseIntPipe) id: number) {
    return this.service.getEstadoDesafio(id);
  }

  @Post('estado-desafio')
  @Roles('ADMIN')
  createEstadoDesafio(@Body() dto: CreateEstadoDesafioDto) {
    return this.service.createEstadoDesafio(dto);
  }

  @Patch('estado-desafio/:id')
  @Roles('ADMIN')
  updateEstadoDesafio(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEstadoDesafioDto) {
    return this.service.updateEstadoDesafio(id, dto);
  }

  //EstadoEntrega
  @Get('estado-entrega')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  listEstadoEntrega(@Query() q: FilterEstadoEntregaDto) {
    return this.service.listEstadoEntrega(q);
  }

  @Get('estado-entrega/:id')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  getEstadoEntrega(@Param('id', ParseIntPipe) id: number) {
    return this.service.getEstadoEntrega(id);
  }

  @Post('estado-entrega')
  @Roles('ADMIN')
  createEstadoEntrega(@Body() dto: CreateEstadoEntregaDto) {
    return this.service.createEstadoEntrega(dto);
  }

  @Patch('estado-entrega/:id')
  @Roles('ADMIN')
  updateEstadoEntrega(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEstadoEntregaDto) {
    return this.service.updateEstadoEntrega(id, dto);
  }

  //EstadoUsuario
  @Get('estado-usuario')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  listEstadoUsuario(@Query() q: FilterEstadoUsuarioDto) {
    return this.service.listEstadoUsuario(q);
  }

  @Get('estado-usuario/:id')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  getEstadoUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.service.getEstadoUsuario(id);
  }

  @Post('estado-usuario')
  @Roles('ADMIN')
  createEstadoUsuario(@Body() dto: CreateEstadoUsuarioDto) {
    return this.service.createEstadoUsuario(dto);
  }

  @Patch('estado-usuario/:id')
  @Roles('ADMIN')
  updateEstadoUsuario(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEstadoUsuarioDto) {
    return this.service.updateEstadoUsuario(id, dto);
  }

  //EstadoVoucher
  @Get('estado-voucher')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  listEstadoVoucher(@Query() q: FilterEstadoVoucherDto) {
    return this.service.listEstadoVoucher(q);
  }

  @Get('estado-voucher/:id')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  getEstadoVoucher(@Param('id', ParseIntPipe) id: number) {
    return this.service.getEstadoVoucher(id);
  }

  @Post('estado-voucher')
  @Roles('ADMIN')
  createEstadoVoucher(@Body() dto: CreateEstadoVoucherDto) {
    return this.service.createEstadoVoucher(dto);
  }

  @Patch('estado-voucher/:id')
  @Roles('ADMIN')
  updateEstadoVoucher(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEstadoVoucherDto) {
    return this.service.updateEstadoVoucher(id, dto);
  }

  //RolUsuario
  @Get('rol-usuario')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  listRolUsuario(@Query() q: FilterRolUsuarioDto) {
    return this.service.listRolUsuario(q);
  }

  @Get('rol-usuario/:id')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  getRolUsuario(@Param('id', ParseIntPipe) id: number) {
    return this.service.getRolUsuario(id);
  }

  @Post('rol-usuario')
  @Roles('ADMIN')
  createRolUsuario(@Body() dto: CreateRolUsuarioDto) {
    return this.service.createRolUsuario(dto);
  }

  @Patch('rol-usuario/:id')
  @Roles('ADMIN')
  updateRolUsuario(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateRolUsuarioDto) {
    return this.service.updateRolUsuario(id, dto);
  }

  //TipoMovimiento
  @Get('tipo-movimiento')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  listTipoMovimiento(@Query() q: FilterTipoMovimientoDto) {
    return this.service.listTipoMovimiento(q);
  }

  @Get('tipo-movimiento/:id')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  getTipoMovimiento(@Param('id', ParseIntPipe) id: number) {
    return this.service.getTipoMovimiento(id);
  }

  @Post('tipo-movimiento')
  @Roles('ADMIN')
  createTipoMovimiento(@Body() dto: CreateTipoMovimientoDto) {
    return this.service.createTipoMovimiento(dto);
  }

  @Patch('tipo-movimiento/:id')
  @Roles('ADMIN')
  updateTipoMovimiento(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTipoMovimientoDto) {
    return this.service.updateTipoMovimiento(id, dto);
  }

  //OrigenMovimiento
  @Get('origen-movimiento')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  listOrigenMovimiento(@Query() q: FilterOrigenMovimientoDto) {
    return this.service.listOrigenMovimiento(q);
  }

  @Get('origen-movimiento/:id')
  @Roles('ADMIN', 'OPERARIO', 'CLIENTE')
  getOrigenMovimiento(@Param('id', ParseIntPipe) id: number) {
    return this.service.getOrigenMovimiento(id);
  }

  @Post('origen-movimiento')
  @Roles('ADMIN')
  createOrigenMovimiento(@Body() dto: CreateOrigenMovimientoDto) {
    return this.service.createOrigenMovimiento(dto);
  }

  @Patch('origen-movimiento/:id')
  @Roles('ADMIN')
  updateOrigenMovimiento(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateOrigenMovimientoDto) {
    return this.service.updateOrigenMovimiento(id, dto);
  }
}
