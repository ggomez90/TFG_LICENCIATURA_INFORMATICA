import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Entrega, Usuario } from '@prisma/client';

import { CreateEntregaDto } from './create-entrega.dto';
import { UpdateEntregaDto } from './update-entrega.dto';
import { UpdateEstadoEntregaDto } from './update-estado-entrega.dto';
import { FilterEntregaDto } from './filter-entrega.dto';
import { RevisarEntregaOperarioDto } from './revisar-entrega-operario.dto';
import { VolverPendienteEntregaDto } from './volver-pendiente-entrega.dto';
import { ConfirmarPuntosEntregaDto } from './confirmar-puntos-entrega.dto';

type ActorCtx = {
  actorRole: 'ADMIN' | 'OPERARIO' | 'CLIENTE' | 'ADMINISTRADOR';
  identifier: string;
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

  private readonly TIPO_CREDITO = 1;
  private readonly ORIGEN_ENTREGA = 1;

  //helper operario
  private async resolveOperarioIdFromIdentifier(identifier: string): Promise<number> {
    const usuario = await this.findUsuarioByIdentifier(identifier);
    return usuario.idUsuario;
  }

  //helpers usuario/cliente
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
    return usuario.idUsuario;
  }

    private toNumber(value: any): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return Number(value);
    if (typeof value?.toNumber === 'function') return value.toNumber();
    return Number(value ?? 0);
  }

  private async getMetaDesafio(idDesafio: number): Promise<number> {
    const desafio = await this.prisma.desafio.findUnique({
      where: { idDesafio },
      select: { meta: true },
    });

    if (!desafio) throw new NotFoundException('Desafío no encontrado');
    return this.toNumber(desafio.meta);
  }

  private async getCantidadComprometidaYConsolidada(params: {
    idInscripcionDesafio: number;
    excludeEntregaId?: number;
  }): Promise<number> {
    const entregas = await this.prisma.entrega.findMany({
      where: {
        idInscripcionDesafio: params.idInscripcionDesafio,
        ...(params.excludeEntregaId ? { idEntrega: { not: params.excludeEntregaId } } : {}),
        estado: {
          in: [
            ESTADO.CREADA,
            ESTADO.PENDIENTE,
            ESTADO.VALIDADA,
            ESTADO.PUNTOS_OTORGADOS,
          ],
        },
      },
      select: {
        cantidadDeclarada: true,
      },
    });

    return entregas.reduce((acc, e) => acc + this.toNumber(e.cantidadDeclarada), 0);
  }

  private async validarCantidadDisponible(params: {
    idDesafio: number;
    idInscripcionDesafio: number;
    cantidadNueva: number;
    excludeEntregaId?: number;
  }): Promise<void> {
    const metaDesafio = await this.getMetaDesafio(params.idDesafio);

    const cantidadYaRegistrada = await this.getCantidadComprometidaYConsolidada({
      idInscripcionDesafio: params.idInscripcionDesafio,
      excludeEntregaId: params.excludeEntregaId,
    });

    const restanteDisponible = Number((metaDesafio - cantidadYaRegistrada).toFixed(3));

    if (restanteDisponible <= 0) {
      throw new BadRequestException(
        `El desafío ya alcanzó su límite máximo. No se pueden registrar más entregas para esta inscripción.`,
      );
    }

    if (params.cantidadNueva > restanteDisponible) {
      throw new BadRequestException(
        `La cantidad ingresada supera el máximo permitido para este desafío. Puede registrar como máximo ${restanteDisponible} unidades.`,
      );
    }
  }

  //create
    async create(dto: CreateEntregaDto, ctx: ActorCtx): Promise<Entrega> {
    if (!['ADMIN', 'ADMINISTRADOR', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para crear entregas.');
    }

    let data: any = { ...dto };

    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (dto.idCliente !== myIdCliente) {
        data.idCliente = myIdCliente;
      }
    }

    const cantidadNueva = this.toNumber(dto.cantidadDeclarada);

    await this.validarCantidadDisponible({
      idDesafio: dto.idDesafio,
      idInscripcionDesafio: dto.idInscripcionDesafio,
      cantidadNueva,
    });

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

  //findAll
  async findAll(filter: FilterEntregaDto, ctx: ActorCtx) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaCreacion',
      order = 'desc',
      idCliente,
      idDesafio,
      estado,
      idInscripcionDesafio,
      fechaDesde,
      fechaHasta,
    } = filter as any;

    const where: Prisma.EntregaWhereInput = {};

    if (ctx.actorRole === 'CLIENTE') {
      // El cliente solo puede ver sus entregas
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
      this.prisma.entrega.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          desafio: {
            select: {
              idDesafio: true,
              titulo: true,
              unidadMedida: true,
              tipoResiduo: true,
              puntosPorUnidad: true,
            },
          },
        },
      }),
      this.prisma.entrega.count({ where }),
    ]);

    return { items, total, limit: take, offset: skip, sortBy, order: sortOrder };
  }

  // update (ADMIN o CLIENTE)
    async update(idEntrega: number, dto: UpdateEntregaDto, ctx: ActorCtx): Promise<Entrega> {
    if (!['ADMIN', 'ADMINISTRADOR', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para actualizar entregas.');
    }

    const entrega = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idEntrega },
    });
    if (!entrega) throw new NotFoundException('Entrega no encontrada');

    if (entrega.estado !== ESTADO.CREADA) {
      throw new BadRequestException('Solo puede editarse una entrega en estado CREADA.');
    }

    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (entrega.idCliente !== myIdCliente) {
        throw new ForbiddenException('No autorizado para editar esta entrega.');
      }
    }

    const cantidadNueva =
      dto.cantidadDeclarada != null
        ? this.toNumber(dto.cantidadDeclarada)
        : this.toNumber(entrega.cantidadDeclarada);

    await this.validarCantidadDisponible({
      idDesafio: entrega.idDesafio,
      idInscripcionDesafio: entrega.idInscripcionDesafio,
      cantidadNueva,
      excludeEntregaId: idEntrega,
    });

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

  //updateEstado (ADMIN/OPERARIO/CLIENTE)
  async updateEstado(idEntrega: number, dto: UpdateEstadoEntregaDto, ctx: ActorCtx): Promise<Entrega> {
    const entrega = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idEntrega },
    });
    if (!entrega) throw new NotFoundException('Entrega no encontrada');

    // Si cliente solo su entrega
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

    //setear marca temporal si valida/rechaza, o limpiar operario/observaciones según casos.
    if (to === ESTADO.VALIDADA || to === ESTADO.RECHAZADA) {
      data.fechaValidacion = new Date();
    }

    return await (this.prisma as any)[this.MODEL].update({
      where: { [this.ID_FIELD]: idEntrega },
      data,
    });
  }

  // transiciones permitidas
  private isTransitionAllowed(
    role: 'ADMIN' | 'ADMINISTRADOR' | 'OPERARIO' | 'CLIENTE',
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

    const allowed = role === 'ADMIN' ? admin : role === 'ADMINISTRADOR' ? admin : role === 'OPERARIO' ? operario : cliente;

    return allowed.some(([f, t]) => f === from && t === to);
  }

  async revisarOperario(
    idEntrega: number,
    dto: RevisarEntregaOperarioDto,
    ctx: ActorCtx,
  ): Promise<Entrega> {
    if (!['ADMIN', 'ADMINISTRADOR', 'OPERARIO'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para revisar entregas.');
    }

    const entrega = await this.prisma.entrega.findUnique({
      where: { idEntrega },
    });

    if (!entrega) throw new NotFoundException('Entrega no encontrada');

    if (entrega.estado !== ESTADO.PENDIENTE) {
      throw new BadRequestException('Solo pueden revisarse entregas en estado PENDIENTE.');
    }

    const idOperarioValidador = await this.resolveOperarioIdFromIdentifier(ctx.identifier);
    const accion = dto.accion;

    const data: Prisma.EntregaUncheckedUpdateInput = {
      idOperarioValidador,
      fechaValidacion: new Date(),
      observaciones: dto.observaciones?.trim() || entrega.observaciones || undefined,
    };

    if (accion === 'VALIDAR') {
      data.estado = ESTADO.VALIDADA;
      data.cantidadVerificada =
        dto.cantidadVerificada != null
          ? new Prisma.Decimal(dto.cantidadVerificada)
          : entrega.cantidadDeclarada;
      data.motivoRechazo = null;
    }

    if (accion === 'RECHAZAR') {
      data.estado = ESTADO.RECHAZADA;
      data.cantidadVerificada =
        dto.cantidadVerificada != null
          ? new Prisma.Decimal(dto.cantidadVerificada)
          : new Prisma.Decimal(0);
      data.motivoRechazo = dto.motivoRechazo?.trim() || 'Entrega rechazada por control operativo.';
    }

    return this.prisma.entrega.update({
      where: { idEntrega },
      data,
    });
  }

  async volverPendienteOperario(
    idEntrega: number,
    dto: VolverPendienteEntregaDto,
    ctx: ActorCtx,
  ): Promise<Entrega> {
    if (!['ADMIN', 'ADMINISTRADOR', 'OPERARIO'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para volver una entrega a pendiente.');
    }

    const entrega = await this.prisma.entrega.findUnique({
      where: { idEntrega },
    });

    if (!entrega) {
      throw new NotFoundException('Entrega no encontrada');
    }

    if (entrega.estado !== ESTADO.VALIDADA && entrega.estado !== ESTADO.RECHAZADA) {
      throw new BadRequestException(
        'Solo una entrega VALIDADA o RECHAZADA puede volver a PENDIENTE.',
      );
    }

    const data: Prisma.EntregaUncheckedUpdateInput = {
      estado: ESTADO.PENDIENTE,
      fechaValidacion: null,
      cantidadVerificada: null,
      motivoRechazo: null,
      idOperarioValidador: null,
      observaciones: dto.observaciones?.trim() || entrega.observaciones || undefined,
    };

    return this.prisma.entrega.update({
      where: { idEntrega },
      data,
    });
  }

  async confirmarPuntosOperario(
    idEntrega: number,
    dto: ConfirmarPuntosEntregaDto,
    ctx: ActorCtx,
  ): Promise<Entrega> {
    if (!['ADMIN', 'ADMINISTRADOR', 'OPERARIO'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para confirmar puntos.');
    }

    const entrega = await this.prisma.entrega.findUnique({
      where: { idEntrega },
      include: {
        desafio: true,
        inscripcion: true,
      } as any,
    });

    if (!entrega) throw new NotFoundException('Entrega no encontrada');

    if (entrega.estado !== ESTADO.VALIDADA) {
      throw new BadRequestException('Solo una entrega VALIDADA puede pasar a PUNTOS OTORGADOS.');
    }

    const idOperarioValidador = await this.resolveOperarioIdFromIdentifier(ctx.identifier);

    const yaExisteMovimiento = await this.prisma.movimientoPuntos.findFirst({
      where: {
        idEntrega,
        origen: this.ORIGEN_ENTREGA,
        descripcion: `Puntos otorgados por entrega #${entrega.idEntrega}`,
      },
    });

    if (yaExisteMovimiento) {
      throw new BadRequestException('La entrega ya tiene un movimiento de puntos asociado.');
    }

    const cantidadBase = this.toNumber(entrega.cantidadVerificada ?? entrega.cantidadDeclarada ?? 0);
    const metaDesafio = this.toNumber((entrega as any)?.desafio?.meta ?? 0);
    const puntosPorUnidad = this.toNumber((entrega as any)?.desafio?.puntosPorUnidad ?? 0);
    const puntosTotalesDesafio = this.toNumber((entrega as any)?.desafio?.puntosTotales ?? 0);
    const bonificacionCompleta = this.toNumber((entrega as any)?.desafio?.bonificacionDesafioCompleto ?? 0);
    const otorgaPuntosParcial = Boolean((entrega as any)?.desafio?.otorgaPuntosParcial);

    const totalPrevio = await this.getCantidadComprometidaYConsolidada({
      idInscripcionDesafio: entrega.idInscripcionDesafio,
      excludeEntregaId: idEntrega,
    });

    const totalConEntrega = Number((totalPrevio + cantidadBase).toFixed(3));

    if (metaDesafio > 0 && totalConEntrega > metaDesafio) {
      const restanteDisponible = Number((metaDesafio - totalPrevio).toFixed(3));
      throw new BadRequestException(
        `La entrega excede el máximo permitido del desafío. Solo pueden consolidarse ${Math.max(0, restanteDisponible)} unidades adicionales.`,
      );
    }

    const progresoIncremento =
      metaDesafio > 0 ? Number(((cantidadBase / metaDesafio) * 100).toFixed(2)) : 0;

    return this.prisma.$transaction(async (tx) => {
      const inscripcionActual = await tx.inscripcionDesafio.findUnique({
        where: { idInscripcionDesafio: entrega.idInscripcionDesafio },
      });

      if (!inscripcionActual) {
        throw new NotFoundException('Inscripción del desafío no encontrada.');
      }

      const progresoActual = this.toNumber(inscripcionActual.progreso ?? 0);
      const nuevoProgreso = Math.min(100, Number((progresoActual + progresoIncremento).toFixed(2)));

      const llegoAlCienAhora = progresoActual < 100 && nuevoProgreso >= 100;

      const yaTieneBonus = await tx.movimientoPuntos.findFirst({
        where: {
          idCliente: entrega.idCliente,
          origen: this.ORIGEN_ENTREGA,
          descripcion: `Bonificación por completar desafío #${entrega.idDesafio}`,
        },
      });

      let puntosEntrega = 0;

      if (otorgaPuntosParcial) {
        puntosEntrega = Math.max(0, Math.round(cantidadBase * puntosPorUnidad));
      } else {
        if (llegoAlCienAhora) {
          puntosEntrega = Math.max(0, Math.round(puntosTotalesDesafio));
        }
      }

      const puntosBonus =
        llegoAlCienAhora && !yaTieneBonus
          ? Math.max(0, Math.round(bonificacionCompleta))
          : 0;

      const totalPuntosAcreditar = puntosEntrega + puntosBonus;

      const entregaActualizada = await tx.entrega.update({
        where: { idEntrega },
        data: {
          estado: ESTADO.PUNTOS_OTORGADOS,
          idOperarioValidador,
          observaciones:
            dto.observaciones?.trim() ||
            entrega.observaciones ||
            'Entrega confirmada para otorgamiento de puntos.',
        },
      });

      if (puntosEntrega > 0) {
        await tx.movimientoPuntos.create({
          data: {
            idCliente: entrega.idCliente,
            fecha: new Date(),
            tipo: this.TIPO_CREDITO,
            origen: this.ORIGEN_ENTREGA,
            puntos: puntosEntrega,
            descripcion: `Puntos otorgados por entrega #${entrega.idEntrega}`,
            idEntrega: entrega.idEntrega,
          },
        });
      }

      if (puntosBonus > 0) {
        await tx.movimientoPuntos.create({
          data: {
            idCliente: entrega.idCliente,
            fecha: new Date(),
            tipo: this.TIPO_CREDITO,
            origen: this.ORIGEN_ENTREGA,
            puntos: puntosBonus,
            descripcion: `Bonificación por completar desafío #${entrega.idDesafio}`,
            idEntrega: entrega.idEntrega,
          },
        });
      }

      if (totalPuntosAcreditar > 0) {
        await tx.cliente.update({
          where: { idCliente: entrega.idCliente },
          data: {
            puntos: { increment: totalPuntosAcreditar },
          },
        });
      }

      await tx.inscripcionDesafio.update({
        where: { idInscripcionDesafio: entrega.idInscripcionDesafio },
        data: {
          puntosAcumulados: { increment: totalPuntosAcreditar },
          progreso: new Prisma.Decimal(nuevoProgreso),
        },
      });

      return entregaActualizada;
    });
  }
}
