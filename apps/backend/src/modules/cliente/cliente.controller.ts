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
  Logger,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { ClienteService } from './cliente.service';
import { CreateClienteDto } from './create-cliente.dto';
import { UpdateClienteDto } from './update-cliente.dto';
import { FilterClienteDto, FilterClienteAdminDto } from './filter-cliente.dto';
import { KeycloakAuthGuard, RolesGuard, Roles, User } from '../../auth';

@Controller('clientes')
export class ClienteController {
  constructor(private readonly clienteService: ClienteService) {}

  @Post()
  @UseGuards(KeycloakAuthGuard)
  async create(@Body() dto: CreateClienteDto) {
    return this.clienteService.create(dto);
  }

  // Lista general solo para admin
  @Get()
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async findAll(@Query() filter: FilterClienteDto) {
    return this.clienteService.findAll(filter);
  }

  // ruta estatica para usuario admin
  @Get('admin')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  @UsePipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        console.warn('[DTO Validation Error]', JSON.stringify(errors, null, 2));
        return new BadRequestException(errors);
      },
    }),
  )
  async adminList(@Query() dto: FilterClienteAdminDto) {
    Logger.log(`GET /clientes/admin dto=${JSON.stringify(dto)}`, 'ClienteController');
    return this.clienteService.findAdminClientesFiltered(dto);
  }

  // ruta estatica para perfil propio
  @Get('me')
  @UseGuards(KeycloakAuthGuard)
  async me(@User() user: any) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.clienteService.findMe(identifier);
  }

  @Patch('me')
  @UseGuards(KeycloakAuthGuard)
  async updateMe(@User() user: any, @Body() dto: UpdateClienteDto) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.clienteService.updateMe(identifier, dto);
  }

  // ruta parametrica para busqueda por id
  @Get(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clienteService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard, RolesGuard)
  @Roles('ADMIN', 'ADMINISTRADOR')
  async updateByAdmin(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clienteService.update(id, dto);
  }
}
