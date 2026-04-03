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

  //helpers para fechas, crear y editar
  // funcion para mantener la coercion entre las fechas
  private coerceCreate(dto: CreateDesafioDto) {
    const data: any = { ...dto };
    if (dto.fechaInicio) data.fechaInicio = new Date(dto.fechaInicio);
    if (dto.fechaFin) data.fechaFin = new Date(dto.fechaFin);
    return data;
  }

  private coerceUpdate(dto: UpdateDesafioDto) {
    const data: any = { ...dto };
    if ((dto as any).fechaInicio) data.fechaInicio = new Date((dto as any).fechaInicio);
    if ((dto as any).fechaFin) data.fechaFin = new Date((dto as any).fechaFin);
    return data;
  }

  async findOne(idDesafio: number): Promise<Desafio> {
    const item = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idDesafio },
    });

    if (!item) {
      throw new NotFoundException('Desafío no encontrado');
    }

    return item;
  }

  // Listado para cualquier rol autenticado
  async findAll(filter: FilterDesafioDto) {
    // Defaults seguros
    const limit = Number((filter as any)?.limit ?? 20);
    const offset = Number((filter as any)?.offset ?? 0);
    const sortBy = ((filter as any)?.sortBy ?? 'fechaInicio') as keyof Prisma.DesafioOrderByWithRelationInput;
    const order = String((filter as any)?.order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    // WHERE incremental
    const where: Prisma.DesafioWhereInput = {};

    // Estado (1=ACTIVO, 2=PAUSADO, 3=FINALIZADO)
    if (filter.estado != null) {
      (where as any).estado = Number(filter.estado);
    }

    // Requiere inscripción (0/1 del DTO y boolean en DB)
    if (filter.requiereInscripcion != null) {
      (where as any).requiereInscripcion = filter.requiereInscripcion === 1;
    }

    // Tipo de residuo (contains)
    if (filter.tipoResiduo?.trim()) {
      where.tipoResiduo = { contains: filter.tipoResiduo.trim() };
    }

    // Búsqueda libre sobre título/descripcion (contains)
    if (filter.q?.trim()) {
      const term = filter.q.trim();
      where.OR = [
        { titulo: { contains: term } },
        { descripcion: { contains: term } },
      ];
    }

    // Rango de fechas sobre fechaInicio
    if (filter.fechaDesde || filter.fechaHasta) {
      const fechaInicio: Prisma.DateTimeFilter = {};
      if (filter.fechaDesde) {
        fechaInicio.gte = new Date(`${filter.fechaDesde}T00:00:00`);
      }
      if (filter.fechaHasta) {
        fechaInicio.lte = new Date(`${filter.fechaHasta}T23:59:59.999`);
      }
      (where as any).fechaInicio = fechaInicio;
    }

    // Orden
    const orderBy: Prisma.DesafioOrderByWithRelationInput = { [sortBy]: order };

    // Query + count
    const [items, total] = await this.prisma.$transaction([
      (this.prisma as any).desafio.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy,
      }),
      (this.prisma as any).desafio.count({ where }),
    ]);

    return { items, total, limit, offset, sortBy, order };
  }

  // Create
  async create(dto: CreateDesafioDto): Promise<Desafio> {
    const data: any = this.coerceCreate(dto);

    // Estado (si viene)
    if (data.estado != null) {
      data.estadoObj = { connect: { idEstadoDesafio: Number(data.estado) } };
      delete data.estado;
    }

    // ContenidoEducativo (si viene)
    if (data.idRecursoEducativo != null) {
      data.recursoEducativo = {
        connect: { idContenidoEducativo: Number(data.idRecursoEducativo) },
      };
      delete data.idRecursoEducativo;
    }

    try {
      return await (this.prisma as any)[this.MODEL].create({ data });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (admin/estado/recursoEducativo).');
      }
      throw error;
    }
  }

  // Update (solo admin)
  async update(idDesafio: number, dto: UpdateDesafioDto): Promise<Desafio> {
    const exists = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idDesafio },
    });
    if (!exists) throw new NotFoundException('Desafío no encontrado');

    const data: any = this.coerceUpdate(dto);

    // Estado (si viene en update)
    if ((data as any).estado != null) {
      data.estadoObj = { connect: { idEstadoDesafio: Number((data as any).estado) } };
      delete data.estado;
    }

    // ContenidoEducativo (si viene en update)
    if ((data as any).idRecursoEducativo != null) {
      data.recursoEducativo = {
        connect: { idContenidoEducativo: Number((data as any).idRecursoEducativo) },
      };
      delete data.idRecursoEducativo;
    }

    try {
      return await (this.prisma as any)[this.MODEL].update({
        where: { [this.ID_FIELD]: idDesafio },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (admin/estado/recursoEducativo).');
      }
      throw error;
    }
  }

  // Update Estado (solo admin)
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

  // indicadores
  async getSummary() {
    const [total, activos, pausados, finalizados, inscripcionesTotales] =
      await this.prisma.$transaction([
        this.prisma.desafio.count(),
        this.prisma.desafio.count({ where: { estado: 1 } }),
        this.prisma.desafio.count({ where: { estado: 2 } }),
        this.prisma.desafio.count({ where: { estado: 3 } }),
        this.prisma.inscripcionDesafio.count(),
      ]);

    return { total, activos, pausados, finalizados, inscripcionesTotales };
  }

  // Create usando el admin del token
  async createWithAdmin(idAdminToken: number, dto: CreateDesafioDto): Promise<Desafio> {
    const adminId = Number(idAdminToken);
    if (!Number.isFinite(adminId)) {
      throw new BadRequestException('No se pudo resolver idAdmin desde token o body.');
    }

    const data: any = this.coerceCreate(dto);

    // Admin (Usuario)
    delete data.idAdmin;
    data.admin = { connect: { idUsuario: adminId } };

    // Estado (requerido)
    if (data.estado != null) {
      data.estadoObj = { connect: { idEstadoDesafio: Number(data.estado) } };
      delete data.estado;
    } else {
      throw new BadRequestException('El estado es requerido.');
    }

    // ContenidoEducativo (opcional)
    if (data.idRecursoEducativo != null) {
      data.recursoEducativo = {
        connect: { idContenidoEducativo: Number(data.idRecursoEducativo) },
      };
      delete data.idRecursoEducativo;
    }

    try {
      return await (this.prisma as any)[this.MODEL].create({ data });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (admin/estado/recursoEducativo).');
      }
      throw error;
    }
  }
}
