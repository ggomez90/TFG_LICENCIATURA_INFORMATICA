import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Entrega, Usuario } from '@prisma/client';

import { CreateEntregaDto } from './create-entrega.dto';
import { UpdateEntregaDto } from './update-entrega.dto';
import { UpdateEstadoEntregaDto } from './update-estado-entrega.dto';
import { FilterEntregaDto } from './filter-entrega.dto';

type ActorCtx = {
  actorRole: 'ADMIN' | 'OPERARIO' | 'CLIENTE';
  identifier: string; // preferred_username | email | username | sub
};

const ESTADO = {
  CREADA: 1,
  PENDIENTE: 2,
  VALIDADA: 3,
  RECHAZADA: 4,
  PUNTOS_OTORGADOS: 5,
  ANULADA: 6,
} as const;

@Injectable()
export class EntregaService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'entrega' as const;
  private readonly ID_FIELD = 'idEntrega' as const;

  // -------------------- helpers: usuario/cliente --------------------
  private async findUsuarioByIdentifier(idOrIdentifier: number | string): Promise<Usuario> {
    let usuario: Usuario | null = null;

    if (typeof idOrIdentifier === 'number' || /^\d+$/.test(String(idOrIdentifier))) {
      usuario = await this.prisma.usuario.findUnique({
        where: { idUsuario: Number(idOrIdentifier) },
      });
    } else {
      const identifier = String(idOrIdentifier).trim();
      usuario = await this.prisma.usuario.findFirst({
        where: {
          OR: [
            { usuario: identifier },
            { email: identifier },
            { dniCuitCuil: identifier },
          ],
        },
      });
    }

    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  private async resolveClienteIdFromIdentifier(identifier: string): Promise<number> {
    const usuario = await this.findUsuarioByIdentifier(identifier);
    // En tu diseño, idCliente = idUsuario (1:1)
    return usuario.idUsuario;
  }

  // -------------------- create --------------------
  async create(dto: CreateEntregaDto, ctx: ActorCtx): Promise<Entrega> {
    // ADMIN o CLIENTE
    if (!['ADMIN', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para crear entregas.');
    }

    // Si quien crea es CLIENTE, forzamos su propio idCliente
    let data: any = { ...dto };
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (dto.idCliente !== myIdCliente) {
        // Forzamos su idCliente para evitar suplantación
        data.idCliente = myIdCliente;
      }
    }

    // Coerción de fechas (los DTO son DateString)
    data.fechaCreacion = new Date(dto.fechaCreacion);
    data.fechaVencimiento = new Date(dto.fechaVencimiento);
    if (dto.fechaValidacion) data.fechaValidacion = new Date(dto.fechaValidacion);

    try {
      return await (this.prisma as any)[this.MODEL].create({ data });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (Cliente/Desafio/Inscripcion/Operario).');
      }
      throw error;
    }
  }

  // -------------------- findAll --------------------
  async findAll(filter: FilterEntregaDto, ctx: ActorCtx) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaCreacion',
      order = 'desc',
      idCliente,
      idDesafio,
      estado,
      // opcionales si aplicaste el patch del DTO:
      idInscripcionDesafio,
      fechaDesde,
      fechaHasta,
    } = filter as any;

    const where: Prisma.EntregaWhereInput = {};

    if (ctx.actorRole === 'CLIENTE') {
      // El cliente solo puede ver sus entregas: resolvemos su idCliente por token
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      where.idCliente = myIdCliente;
    } else {
      if (idCliente) where.idCliente = Number(idCliente);
    }

    if (idDesafio) where.idDesafio = Number(idDesafio);
    if (estado) where.estado = Number(estado);

    if (idInscripcionDesafio) (where as any).idInscripcionDesafio = Number(idInscripcionDesafio);

    if (fechaDesde || fechaHasta) {
      where.fechaCreacion = {
        ...(fechaDesde ? { gte: new Date(fechaDesde) } : {}),
        ...(fechaHasta ? { lte: new Date(fechaHasta) } : {}),
      };
    }

    const sortField = (sortBy ?? 'fechaCreacion') as keyof Prisma.EntregaOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.EntregaOrderByWithRelationInput = { [sortField]: sortOrder };

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

  // -------------------- update (ADMIN o CLIENTE) --------------------
  async update(idEntrega: number, dto: UpdateEntregaDto, ctx: ActorCtx): Promise<Entrega> {
    if (!['ADMIN', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para actualizar entregas.');
    }

    const entrega = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idEntrega },
    });
    if (!entrega) throw new NotFoundException('Entrega no encontrada');

    // Regla: solo editable si estado actual == CREADA (1)
    if (entrega.estado !== ESTADO.CREADA) {
      throw new BadRequestException('Solo puede editarse una entrega en estado CREADA.');
    }

    // Si es CLIENTE: solo su propia entrega
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (entrega.idCliente !== myIdCliente) {
        throw new ForbiddenException('No autorizado para editar esta entrega.');
      }
    }

    // Coerción de fechas si vienen
    const data: any = { ...dto };
    if (dto.fechaCreacion) data.fechaCreacion = new Date(dto.fechaCreacion as any);
    if (dto.fechaVencimiento) data.fechaVencimiento = new Date(dto.fechaVencimiento as any);
    if (dto.fechaValidacion) data.fechaValidacion = new Date(dto.fechaValidacion as any);

    try {
      return await (this.prisma as any)[this.MODEL].update({
        where: { [this.ID_FIELD]: idEntrega },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (Cliente/Desafio/Inscripcion/Operario).');
      }
      throw error;
    }
  }

  // -------------------- updateEstado (ADMIN/OPERARIO/CLIENTE) --------------------
  async updateEstado(idEntrega: number, dto: UpdateEstadoEntregaDto, ctx: ActorCtx): Promise<Entrega> {
    const entrega = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idEntrega },
    });
    if (!entrega) throw new NotFoundException('Entrega no encontrada');

    // Si cliente: solo su entrega
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (entrega.idCliente !== myIdCliente) {
        throw new ForbiddenException('No autorizado para cambiar el estado de esta entrega.');
      }
    }

    const from = entrega.estado;
    const to = Number(dto.idEstadoEntrega);

    if (!this.isTransitionAllowed(ctx.actorRole, from, to)) {
      throw new ForbiddenException(`Transición de estado no permitida para el rol ${ctx.actorRole} (${from} → ${to}).`);
    }

    const data: any = { estado: to };

    // Reglas útiles: setear marca temporal si valida/rechaza, o limpiar operario/observaciones según casos.
    if (to === ESTADO.VALIDADA || to === ESTADO.RECHAZADA) {
      data.fechaValidacion = new Date(); // si querés registrar cuándo se validó/rechazó
      // data.idOperarioValidador = ?? // si querés registrar quién (podemos resolverlo por token si lo necesitás)
    }

    return await (this.prisma as any)[this.MODEL].update({
      where: { [this.ID_FIELD]: idEntrega },
      data,
    });
  }

  // -------------------- allowed transitions --------------------
  private isTransitionAllowed(
    role: 'ADMIN' | 'OPERARIO' | 'CLIENTE',
    from: number,
    to: number,
  ): boolean {
    const operario: Array<[number, number]> = [
      [ESTADO.PENDIENTE, ESTADO.VALIDADA],
      [ESTADO.PENDIENTE, ESTADO.RECHAZADA],
      [ESTADO.RECHAZADA, ESTADO.PENDIENTE],
      [ESTADO.VALIDADA, ESTADO.PENDIENTE],
      [ESTADO.VALIDADA, ESTADO.PUNTOS_OTORGADOS],
    ];

    const cliente: Array<[number, number]> = [
      [ESTADO.CREADA, ESTADO.PENDIENTE],
      [ESTADO.CREADA, ESTADO.ANULADA],
      [ESTADO.PENDIENTE, ESTADO.ANULADA],
      [ESTADO.PENDIENTE, ESTADO.CREADA],
    ];

    const admin = [...operario, ...cliente];

    const allowed = role === 'ADMIN' ? admin : role === 'OPERARIO' ? operario : cliente;

    return allowed.some(([f, t]) => f === from && t === to);
  }
}
