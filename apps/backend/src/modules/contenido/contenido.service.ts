import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

import { CreateContenidoEducativoDto } from './create-contenido-educativo.dto';
import { UpdateContenidoEducativoDto } from './update-contenido-educativo.dto';
import { UpdateVisibleContenidoDto } from './update-visible-contenido.dto';
import { ListContenidoEducativoDto } from './list-contenido.dto';
import { FilterContenidoAdminDto } from './filter-contenido-admin.dto';

@Injectable()
export class ContenidoService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'contenidoEducativo' as const;
  private readonly ID_FIELD = 'idContenido' as const;

  private coerceCreate(dto: CreateContenidoEducativoDto) {
    const data: any = { ...dto };
    if (dto.fechaPublicacion) data.fechaPublicacion = new Date(dto.fechaPublicacion);
    if (dto.fechaBaja) data.fechaBaja = new Date(dto.fechaBaja);
    return data;
  }

  private coerceUpdate(dto: UpdateContenidoEducativoDto) {
    const data: any = { ...dto };
    if (dto.fechaPublicacion) data.fechaPublicacion = new Date(dto.fechaPublicacion as any);
    if (dto.fechaBaja) data.fechaBaja = new Date(dto.fechaBaja as any);
    return data;
  }

  // Publico
  async listPublic(): Promise<ListContenidoEducativoDto[]> {
    const now = new Date();

    const rows = await (this.prisma as any)[this.MODEL].findMany({
      where: {
        visible: true,
        OR: [{ fechaBaja: null }, { fechaBaja: { gte: now } }],
      },
      orderBy: { fechaPublicacion: 'desc' },
      select: { fechaPublicacion: true, titulo: true, visible: true },
    });

    return rows as ListContenidoEducativoDto[];
  }

  // ADMIN: listado con filtros + orden + paginación
  async listAdmin(filter: FilterContenidoAdminDto) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaPublicacion',
      order = 'desc',
      idAdmin,
      visible,
      fechaDesde,
      fechaHasta,
      q,
    } = filter as any;

    const where: Prisma.ContenidoEducativoWhereInput = {};

    if (q) {
      where.OR = [
        { titulo: { contains: q } },
        { descripcion: { contains: q } },
      ];
    }

    if (typeof idAdmin !== 'undefined' && idAdmin !== null) {
      where.idAdmin = Number(idAdmin);
    }

    if (typeof visible === 'boolean') {
      where.visible = visible;
    }

    if (fechaDesde || fechaHasta) {
      where.fechaPublicacion = {
        ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
        ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
      };
    }

    const sortField = sortBy as keyof Prisma.ContenidoEducativoOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = order.toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.ContenidoEducativoOrderByWithRelationInput = { [sortField]: sortOrder };

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

  // ADMIN: create/update/visible
  async create(dto: CreateContenidoEducativoDto) {
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

  async update(idContenido: number, dto: UpdateContenidoEducativoDto) {
    const exists = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idContenido },
    });
    if (!exists) throw new NotFoundException('Contenido no encontrado');

    const data = this.coerceUpdate(dto);

    try {
      return await (this.prisma as any)[this.MODEL].update({
        where: { [this.ID_FIELD]: idContenido },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (idAdmin u otra FK).');
      }
      throw error;
    }
  }

  async updateVisible(idContenido: number, dto: UpdateVisibleContenidoDto) {
    const exists = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idContenido },
    });
    if (!exists) throw new NotFoundException('Contenido no encontrado');

    return (this.prisma as any)[this.MODEL].update({
      where: { [this.ID_FIELD]: idContenido },
      data: { visible: dto.visible },
      select: { [this.ID_FIELD]: true, visible: true } as any,
    });
  }
}
