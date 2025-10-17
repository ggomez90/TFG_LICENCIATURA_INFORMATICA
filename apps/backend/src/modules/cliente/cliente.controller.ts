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
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './create-cliente.dto';
import { UpdateClienteDto } from './update-cliente.dto';
import { FilterClienteDto } from './filter-cliente.dto';

import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  // =====================================================
  // Crear cliente (requiere login de cualquier rol)
  // Nota: CreateClienteDto exige idCliente; el frontend debe enviarlo.
  // Si querés inferirlo del token, puedo darte una variante de endpoint.
  // =====================================================
  @Post()
  @UseGuards(KeycloakAuthGuard)
  async create(@Body() dto: CreateClienteDto) {
    return this.clienteService.create(dto);
  }

  // =====================================================
  // Solo ADMIN
  // =====================================================
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findAll(@Query() filter: FilterClienteDto) {
    return this.clienteService.findAll(filter);
  }

  @Get(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clienteService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clienteService.update(id, dto);
  }

  // =====================================================
  // Login requerido (cualquier rol) - perfil propio
  // =====================================================
  @Get('me')
  @UseGuards(KeycloakAuthGuard)
  async me(@User() user: any) {
    const identifier =
      user?.preferred_username ??
      user?.email ??
      user?.username ??
      user?.sub;

    return this.clienteService.findMe(identifier);
  }

  @Patch('me')
  @UseGuards(KeycloakAuthGuard)
  async updateMe(@User() user: any, @Body() dto: UpdateClienteDto) {
    const identifier =
      user?.preferred_username ??
      user?.email ??
      user?.username ??
      user?.sub;

    return this.clienteService.updateMe(identifier, dto);
  }
}
