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
import { RespuestaService } from './respuesta.service';
import { CreateRespuestaEncuestaDto } from './create-respuesta-encuesta.dto';
import { UpdateRespuestaEncuestaDto } from './update-respuesta-encuesta.dto';
import { FilterRespuestaDto } from './filter-respuesta.dto';
import { Public } from 'nest-keycloak-connect';
import { KeycloakAuthGuard, User } from '../../auth';

@Controller('respuestas')
export class RespuestaController {
  constructor(private readonly respuestaService: RespuestaService) {}

  // PUBLICO (INVITADO)
  @Public()
  @Post('public')
  async createPublic(@Body() dto: CreateRespuestaEncuestaDto) {
    return this.respuestaService.createPublic(dto);
  }

  // Chequeo público: si ya existe respuesta para una encuesta por DNI (para bloquear UI invitado)
  @Public()
  @Get('public/check')
  async checkPublic(
    @Query('idEncuesta', ParseIntPipe) idEncuesta: number,
    @Query('dni') dni: string,
  ) {
    return this.respuestaService.checkPublic(idEncuesta, dni);
  }

  // Chequeo público ampliado: respuesta previa + si el DNI pertenece a un usuario registrado
  @Public()
  @Get('public/validate')
  async validatePublic(
    @Query('idEncuesta', ParseIntPipe) idEncuesta: number,
    @Query('dni') dni: string,
  ) {
    return this.respuestaService.validatePublic(idEncuesta, dni);
  }

  @Get('mine')
  @UseGuards(KeycloakAuthGuard)
  async findMine(
    @User() user: any,
    @Query('idEncuesta', ParseIntPipe) idEncuesta: number,
  ) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;

    return this.respuestaService.findMine(idEncuesta, { identifier });
  }

  // LOGUEADO
  @Post()
  @UseGuards(KeycloakAuthGuard)
  async createMine(@User() user: any, @Body() dto: CreateRespuestaEncuestaDto) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;
    return this.respuestaService.createMine(dto, { identifier });
  }

  // Login requerido cualquier rol (lista: admin ve todo, cliente ve lo suyo)
  @Get()
  @UseGuards(KeycloakAuthGuard)
  async findAll(@User() user: any, @Query() filter: FilterRespuestaDto) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;
    return this.respuestaService.findAll(filter, { identifier });
  }

  @Patch(':id')
  @UseGuards(KeycloakAuthGuard)
  async update(
    @User() user: any,
    @Param('id', ParseIntPipe) idRespuesta: number,
    @Body() dto: UpdateRespuestaEncuestaDto,
  ) {
    const identifier =
      user?.preferred_username ?? user?.email ?? user?.username ?? user?.sub;
    return this.respuestaService.update(idRespuesta, dto, { identifier });
  }
}