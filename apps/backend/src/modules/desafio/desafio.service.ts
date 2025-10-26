import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Desafio } from '@prisma/client';

import { CreateDesafioDto } from './create-desafio.dto';
import { UpdateDesafioDto } from './update-desafio.dto';
import { UpdateEstadoDesafioDto } from './update-estado-desafio.dto';
import { FilterDesafioDto } from './filter-desafio.dto';

@Injectable()
export class DesafioService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'desafio' as const;
  private readonly ID_FIELD = 'idDesafio' as const;

  //Helpers: coerción de fechas 
  private coerceCreate(dto: CreateDesafioDto) {
    const data: any = { ...dto };
    if (dto.fechaInicio) data.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) data.fechaFin = new Date(dto.fechaFin);
    return data;
  }

  private coerceUpdate(dto: UpdateDesafioDto) {
    const data: any = { ...dto };
    if (dto.fechaInicio) data.fechaInicio = new Date(dto.fechaInicio as any);
    if (dto.fechaFin) data.fechaFin = new Date(dto.fechaFin as any);
    return data;
  }

  // List (cualquier rol autenticado)
  async findAll(filter: FilterDesafioDto) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaInicio',
      order = 'desc',
      estado,
    } = filter as any;

    const where: Prisma.DesafioWhereInput = {};

    if (typeof estado !== 'undefined' && estado !== null) {
      (where as any).estado = Number(estado);
    }

    const sortField = (sortBy ?? 'fechaInicio') as keyof Prisma.DesafioOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.DesafioOrderByWithRelationInput = { [sortField]: sortOrder };

    const take = Number(limit);
    const skip = Number(offset);

    const [items, total] = await this.prisma.$transaction([
      (this.prisma as any)[this.MODEL].findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      (this.prisma as any)[this.MODEL].count({ where }),
    ]);

    return { items, total, limit: take, offset: skip, sortBy, order: sortOrder };
  }

  //Create (ADMIN)
  async create(dto: CreateDesafioDto): Promise<Desafio> {
    const data = this.coerceCreate(dto);

    try {
      return await (this.prisma as any)[this.MODEL].create({ data });
    } catch (error: any) {
      // FK inválida: idAdmin, estado, idRecursoEducativo
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (idAdmin/estado/idRecursoEducativo).');
      }
      throw error;
    }
  }

  //Update (ADMIN)
  async update(idDesafio: number, dto: UpdateDesafioDto): Promise<Desafio> {
    const exists = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idDesafio },
    });
    if (!exists) throw new NotFoundException('Desafío no encontrado');

    const data = this.coerceUpdate(dto);

    try {
      return await (this.prisma as any)[this.MODEL].update({
        where: { [this.ID_FIELD]: idDesafio },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (idAdmin/estado/idRecursoEducativo).');
      }
      throw error;
    }
  }

  //Update Estado (ADMIN
  async updateEstado(idDesafio: number, dto: UpdateEstadoDesafioDto): Promise<Desafio> {
    const exists = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idDesafio },
    });
    if (!exists) throw new NotFoundException('Desafío no encontrado');

    const data: any = {
      estado: dto.idEstadoDesafio,
    };

    return await (this.prisma as any)[this.MODEL].update({
      where: { [this.ID_FIELD]: idDesafio },
      data,
    });
  }
}
