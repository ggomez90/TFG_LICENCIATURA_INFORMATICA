import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  // constantes con nombre del modelo y campo ID reales
  private readonly MODEL = 'contenidoEducativo' as const;
  private readonly ID_FIELD = 'idContenidoEducativo' as const;

  //helpers para crear y editar
  private coerceCreate(dto: CreateContenidoEducativoDto) {
    const data: any = { ...dto };
    if (dto.fechaPublicacion)
      data.fechaPublicacion = new Date(dto.fechaPublicacion);
    if (dto.fechaBaja) data.fechaBaja = new Date(dto.fechaBaja);
    return data;
  }

  private coerceUpdate(dto: UpdateContenidoEducativoDto) {
    const data: any = { ...dto };
    if (dto.fechaPublicacion)
      data.fechaPublicacion = new Date(dto.fechaPublicacion as any);
    if (dto.fechaBaja) data.fechaBaja = new Date(dto.fechaBaja as any);
    return data;
  }

  // Listado público (solo visibles y vigentes)
  async listPublic(): Promise<ListContenidoEducativoDto[]> {
    const now = new Date();

    const rows = await (this.prisma as any)[this.MODEL].findMany({
      where: {
        visible: true,
        OR: [{ fechaBaja: null }, { fechaBaja: { gte: now } }],
      },
      orderBy: { fechaPublicacion: 'desc' },
      select: {
        [this.ID_FIELD]: true,
        fechaPublicacion: true,
        titulo: true,
        visible: true,
      },
    });

    return rows as ListContenidoEducativoDto[];
  }

  // listado para admin con filtrado completo
  async listAdmin(filter: FilterContenidoAdminDto) {
    const f: any = filter;

    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaPublicacion',
      order = 'desc',
      idAdmin,
      fechaDesde,
      fechaHasta,
      q,
    } = f;

    const where: Prisma.ContenidoEducativoWhereInput = {};

    // constante para la visibilidad
    const rawVisible = (filter as any).visible;

    if (typeof rawVisible === 'boolean') {
      where.visible = rawVisible;
    } else if (rawVisible !== undefined && rawVisible !== null && rawVisible !== '') {
      // Por si llega como string, aunque en el front va un select no tipeo
      const v = String(rawVisible).toLowerCase().trim();
      if (v === 'true' || v === '1') where.visible = true;
      else if (v === 'false' || v === '0') where.visible = false;
    }

    // bsqueda por texto en título / descripción
    if (q) {
      where.OR = [
        { titulo: { contains: q } },
        { descripcion: { contains: q } },
      ];
    }

    // Filtro por admin
    if (typeof idAdmin !== 'undefined' && idAdmin !== null) {
      where.idAdmin = Number(idAdmin);
    }

    // Rango de fechas (filtra por fechaPublicacion)
    if (fechaDesde || fechaHasta) {
      where.fechaPublicacion = {
        ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
        ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
      };
    }

    // ORDEN Y PAGINACIÓN 
    const sortField =
      sortBy as keyof Prisma.ContenidoEducativoOrderByWithRelationInput;

    const sortOrder: Prisma.SortOrder =
      (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const orderBy: Prisma.ContenidoEducativoOrderByWithRelationInput = {
      [sortField]: sortOrder,
    };

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

    return {
      items,
      total,
      limit: take,
      offset: skip,
      sortBy,
      order: sortOrder,
    };
  }

  // METODOS ADMIN: CREATE, UPDATE Y VISIBLE

  // Crear contenido, solo admin
  async create(dto: CreateContenidoEducativoDto) {
    const data = this.coerceCreate(dto);
    try {
      return await (this.prisma as any)[this.MODEL].create({ data });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'Alguna referencia es inválida (idAdmin u otra FK).',
        );
      }
      throw error;
    }
  }

  // actualizar contenido
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
        throw new BadRequestException(
          'Alguna referencia es inválida (idAdmin u otra FK).',
        );
      }
      throw error;
    }
  }

  // cambiar visibilidad
  async updateVisible(
    idContenido: number,
    dto: UpdateVisibleContenidoDto,
  ) {
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

  // DETALLE/BUSQUEDA POR ID

  // Cliente obtiene un contenido solo si es visible y no está dado de baja
  async getPublicById(idContenido: number) {
    const now = new Date();

    return (this.prisma as any)[this.MODEL].findFirst({
      where: {
        [this.ID_FIELD]: idContenido,
        visible: true,
        OR: [{ fechaBaja: null }, { fechaBaja: { gte: now } }],
      },
    });
  }

  // Admin obtiene un contenido por id (incluye ocultos)
  async getAdminById(idContenido: number) {
    return (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idContenido },
    });
  }
}
