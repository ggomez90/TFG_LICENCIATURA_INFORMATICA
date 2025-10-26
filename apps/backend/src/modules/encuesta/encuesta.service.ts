import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Encuesta } from '@prisma/client';

import { CreateEncuestaDto } from './create-encuesta.dto';
import { UpdateEncuestaDto } from './update-encuesta.dto';
import { UpdateActivaEncuestaDto } from './update-activa-encuesta.dto';
import { FilterEncuestaPublicDto } from './filter-encuesta.dto';

@Injectable()
export class EncuestaService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'encuesta' as const;
  private readonly ID_FIELD = 'idEncuesta' as const;

  //Helpers de fechas
  private coerceCreate(dto: CreateEncuestaDto) {
    const data: any = { ...dto };
    if (dto.fechaPublicacion) data.fechaPublicacion = new Date(dto.fechaPublicacion);
    if (dto.fechaCierre) data.fechaCierre = new Date(dto.fechaCierre);
    return data;
  }

  private coerceUpdate(dto: UpdateEncuestaDto) {
    const data: any = { ...dto };
    if (dto.fechaPublicacion) data.fechaPublicacion = new Date(dto.fechaPublicacion as any);
    if (dto.fechaCierre) data.fechaCierre = new Date(dto.fechaCierre as any);
    return data;
  }

  //Publico listado/filtrado
  async listPublic(filter: FilterEncuestaPublicDto) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaPublicacion',
      order = 'desc',
      q,
      activa,
      fechaDesde,
      fechaHasta,
    } = filter as any;

    const where: Prisma.EncuestaWhereInput = {};

    if (q) {
      where.titulo = { contains: q };
    }

    if (typeof activa === 'boolean') {
      where.activa = activa;
    }

    if (fechaDesde || fechaHasta) {
      where.fechaPublicacion = {
        ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
        ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
      };
    }

    const sortField = sortBy as keyof Prisma.EncuestaOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.EncuestaOrderByWithRelationInput = { [sortField]: sortOrder };

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

  // ADMIN create/update/activa
  async create(dto: CreateEncuestaDto): Promise<Encuesta> {
    const data = this.coerceCreate(dto);
    try {
      return await (this.prisma as any)[this.MODEL].create({ data });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (idAdmin u otra FK).');
      }
      throw error;
    }
  }

  async update(idEncuesta: number, dto: UpdateEncuestaDto): Promise<Encuesta> {
    const exists = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idEncuesta },
    });
    if (!exists) throw new NotFoundException('Encuesta no encontrada');

    const data = this.coerceUpdate(dto);

    try {
      return await (this.prisma as any)[this.MODEL].update({
        where: { [this.ID_FIELD]: idEncuesta },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (idAdmin u otra FK).');
      }
      throw error;
    }
  }

  async updateActiva(idEncuesta: number, dto: UpdateActivaEncuestaDto): Promise<Encuesta> {
    const exists = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idEncuesta },
    });
    if (!exists) throw new NotFoundException('Encuesta no encontrada');

    return (this.prisma as any)[this.MODEL].update({
      where: { [this.ID_FIELD]: idEncuesta },
      data: { activa: dto.activa },
      select: { [this.ID_FIELD]: true, activa: true } as any,
    });
  }
}
