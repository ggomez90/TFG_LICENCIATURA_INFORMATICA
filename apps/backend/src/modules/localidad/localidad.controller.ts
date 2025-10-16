import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LocalidadService } from './localidad.service';
import { CreateLocalidadDto } from './localidad.dto';
import { UpdateLocalidadDto } from './localidad.dto';
import { FilterLocalidadDto } from './localidad.dto';
import { AuthGuard } from 'nest-keycloak-connect';

@UseGuards(AuthGuard) // login obligatorio para todos los roles
@Controller('localidad')
export class LocalidadController {
  constructor(private readonly service: LocalidadService) {}

  @Get()
  async findAll(@Query() filter: FilterLocalidadDto) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateLocalidadDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLocalidadDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
