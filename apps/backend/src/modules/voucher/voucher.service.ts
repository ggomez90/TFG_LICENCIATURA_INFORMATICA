import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Usuario, Voucher } from '@prisma/client';

import { CreateVoucherDto } from './create-voucher.dto';
import { UpdateEstadoVoucherDto } from './update-estado-voucher.dto';
import { FilterVoucherDto } from './filter-voucher.dto';
import { AdquirirVoucherClienteDto } from './adquirir-voucher-cliente.dto';

type ActorCtx = {
  actorRole: 'ADMIN' | 'CLIENTE';
  identifier: string;
};

// ID de tabla catalogo
const ESTADO = {
  CREADO: 1,
  ADQUIRIDO: 2,
  UTILIZADO: 3,
  ANULADO: 4,
} as const;

const TIPO_MOVIMIENTO = {
  CREDITO: 1,
  DEBITO: 2,
} as const;

const ORIGEN_MOVIMIENTO = {
  ENTREGA: 1,
  VOUCHER: 2,
  AJUSTE: 3,
} as const;

@Injectable()
export class VoucherService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'voucher' as const;
  private readonly ID_FIELD = 'idVoucher' as const;

  //helpers usuario / cliente
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
    // idCliente = idUsuario (1:1)
    return usuario.idUsuario;
  }

    private async getClienteConPuntos(idCliente: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { idCliente },
      select: {
        idCliente: true,
        puntos: true,
      },
    });

    if (!cliente) {
      throw new NotFoundException('Cliente no encontrado');
    }

    return cliente;
  }

  private async getVoucherTipoCanjeable(idVoucherTipo: number) {
    const now = new Date();

    const tipo = await this.prisma.voucherTipo.findFirst({
      where: {
        idVoucherTipo,
        activa: true,
        fechaInicioVigencia: { lte: now },
        fechaFinVigencia: { gte: now },
      },
    });

    if (!tipo) {
      throw new NotFoundException('Tipo de voucher no disponible para canje');
    }

    return tipo;
  }

  private isTransitionAllowed(
    role: 'ADMIN' | 'CLIENTE',
    from: number,
    to: number,
  ): boolean {
    const cliente: Array<[number, number]> = [
      [ESTADO.CREADO, ESTADO.ADQUIRIDO],
      [ESTADO.CREADO, ESTADO.ANULADO],
      [ESTADO.ADQUIRIDO, ESTADO.CREADO],

      // cliente puede anular un voucher adquirido que aun no se haya utilizado
      [ESTADO.ADQUIRIDO, ESTADO.ANULADO],
    ];

    const admin: Array<[number, number]> = [
      ...cliente,
      [ESTADO.ADQUIRIDO, ESTADO.UTILIZADO],
      [ESTADO.UTILIZADO, ESTADO.ADQUIRIDO],
      [ESTADO.ADQUIRIDO, ESTADO.ANULADO],
    ];

    const allowed = role === 'ADMIN' ? admin : cliente;
    return allowed.some(([f, t]) => f === from && t === to);
  }


  //Crear voucher
  async create(dto: CreateVoucherDto, ctx: ActorCtx): Promise<Voucher> {
    if (!['ADMIN', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para crear vouchers.');
    }

    const data: any = { ...dto };

    // Si crea CLIENTE va su idCliente
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (dto.idCliente !== myIdCliente) {
        data.idCliente = myIdCliente;
      }
    }

    // Fechas a Date
    if (dto.fechaAdquisicion) data.fechaAdquisicion = new Date(dto.fechaAdquisicion);
    if (dto.fechaUso) data.fechaUso = new Date(dto.fechaUso);

    try {
      return await (this.prisma as any)[this.MODEL].create({ data });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (Cliente/Tipo/Estado).');
      }
      throw error;
    }
  }

  //Listar
  async findAll(filter: FilterVoucherDto, ctx: ActorCtx) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaAdquisicion',
      order = 'desc',
      idVoucher,
      idCliente,
      idEstadoVoucher,
      idVoucherTipo,
    } = filter as any;

    const where: Prisma.VoucherWhereInput = {};

    if (idVoucher) (where as any).idVoucher = Number(idVoucher);

    // Si el usuario es CLIENTE, forzamos sus propios vouchers
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      where.idCliente = myIdCliente;
    } else {
      if (idCliente) where.idCliente = Number(idCliente);
    }

    if (idEstadoVoucher) (where as any).estadoVoucher = Number(idEstadoVoucher);

    //filtro por tipo
    if (idVoucherTipo) (where as any).idVoucherTipo = Number(idVoucherTipo);

    const sortField = (sortBy ?? 'fechaAdquisicion') as keyof Prisma.VoucherOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.VoucherOrderByWithRelationInput = { [sortField]: sortOrder };

    const take = Number(limit);
    const skip = Number(offset);

    const [items, total] = await this.prisma.$transaction([
    this.prisma.voucher.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        voucherTipo: {
          select: {
            idVoucherTipo: true,
            titulo: true,
            puntosRequeridos: true,
            montoBeneficio: true,
          },
        },
      },
    }),
    this.prisma.voucher.count({ where }),
  ]);

    return { items, total, limit: take, offset: skip, sortBy, order: sortOrder };
  }

  // actualizar estado
  async updateEstado(idVoucher: number, dto: UpdateEstadoVoucherDto, ctx: ActorCtx): Promise<Voucher> {
    if (!['ADMIN', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para cambiar estado de vouchers.');
    }

    const current = await this.prisma.voucher.findUnique({
      where: { idVoucher },
    });
    if (!current) throw new NotFoundException('Voucher no encontrado');

    // Cliente solo sus vouchers
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (!myIdCliente || Number(current.idCliente) !== Number(myIdCliente)) {
        throw new ForbiddenException('No autorizado para cambiar el estado de este voucher.');
      }
    }

    // estdoVoucher
    const from = Number(current.estadoVoucher ?? 0);

    //idEstadoVoucher de tabla catalogo
    const to = Number(dto.idEstadoVoucher);

    if (!this.isTransitionAllowed(ctx.actorRole, from, to)) {
      throw new ForbiddenException(`Transición de estado no permitida (${from} → ${to}) para rol ${ctx.actorRole}.`);
    }

    try {
      return await this.prisma.voucher.update({
        where: { idVoucher },
        data: { estadoVoucher: to },
      });
    } catch (error: any) {
      // Si la FK del estado no existe
      if (error?.code === 'P2003') {
        throw new BadRequestException('Estado de voucher inválido.');
      }
      throw error;
    }
  }


  // editar voucher por id (bloquear si está UTILIZADO o ANULADO)
  async update(idVoucher: number, dto: any, ctx: ActorCtx): Promise<Voucher> {
    if (!['ADMIN', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para editar vouchers.');
    }

    const current = await this.prisma.voucher.findUnique({
      where: { idVoucher },
    });
    if (!current) throw new NotFoundException('Voucher no encontrado');

    const estadoActual = Number(current.estadoVoucher ?? 0);

    // Regla: NO se puede editar si está UTILIZADO (3) o ANULADO (4)
    if (estadoActual === ESTADO.UTILIZADO || estadoActual === ESTADO.ANULADO) {
      throw new ForbiddenException('No se puede editar un voucher UTILIZADO o ANULADO.');
    }

    // CLIENTE solo puede editar sus vouchers
    if (ctx.actorRole === 'CLIENTE') {
      const idClienteActor = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (!idClienteActor || Number(current.idCliente) !== Number(idClienteActor)) {
        throw new ForbiddenException('No tenés permiso para editar este voucher');
      }
    }

    // Data permitida (UpdateVoucherDto = PartialType(CreateVoucherDto))
    const data: any = { ...dto };

    // Normalización
    if (data.idCliente !== undefined) data.idCliente = Number(data.idCliente);
    if (data.idVoucherTipo !== undefined) data.idVoucherTipo = Number(data.idVoucherTipo);

    if (data.estadoVoucher !== undefined) {
      data.estadoVoucher = Number(data.estadoVoucher);

      // Bloqueo recomendado: no permitir setear UTILIZADO / ANULADO desde "editar"
      if (data.estadoVoucher === ESTADO.UTILIZADO || data.estadoVoucher === ESTADO.ANULADO) {
        throw new ForbiddenException('Para marcar UTILIZADO o ANULADO usá el cambio de estado.');
      }
    }

    // Fechas a Date
    if (data.fechaAdquisicion !== undefined && data.fechaAdquisicion !== null) {
      data.fechaAdquisicion = new Date(data.fechaAdquisicion);
    }
    if (data.fechaUso !== undefined) {
      data.fechaUso = data.fechaUso ? new Date(data.fechaUso) : null;
    }

    try {
      return await this.prisma.voucher.update({
        where: { idVoucher },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (Cliente/Tipo/Estado).');
      }
      throw error;
    }
  }

  async existsForTipo(idVoucherTipo: number): Promise<boolean> {
    const count = await this.prisma.voucher.count({
      where: { idVoucherTipo: Number(idVoucherTipo) },
    });
    return count > 0;
  }

  //buscar voucher por id
  async findOne(idVoucher: number, ctx: ActorCtx) {
    const found = await this.prisma.voucher.findUnique({
      where: { idVoucher },
      include: {
        voucherTipo: { select: { idVoucherTipo: true, titulo: true } },
      },
    });

    if (!found) throw new NotFoundException('Voucher no encontrado');

    // Si es CLIENTE, solo puede ver sus vouchers
    if (ctx.actorRole === 'CLIENTE') {
      const idClienteActor = await this.resolveClienteIdFromIdentifier(ctx.identifier);

      if (!idClienteActor || Number(found.idCliente) !== Number(idClienteActor)) {
        throw new ForbiddenException('No tenés permiso para ver este voucher');
      }
    }

    return found;
  }

    async adquirirVoucherCliente(dto: AdquirirVoucherClienteDto, ctx: ActorCtx) {
    if (ctx.actorRole !== 'CLIENTE') {
      throw new ForbiddenException('Solo un cliente puede adquirir vouchers desde este endpoint.');
    }

    const idCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);

    const cliente = await this.getClienteConPuntos(idCliente);
    const voucherTipo = await this.getVoucherTipoCanjeable(dto.idVoucherTipo);

    const puntosCliente = Number(cliente.puntos ?? 0);
    const puntosRequeridos = Number(voucherTipo.puntosRequeridos ?? 0);

    if (puntosCliente < puntosRequeridos) {
      throw new BadRequestException(
        `Puntos insuficientes para adquirir el voucher. Disponibles: ${puntosCliente}, requeridos: ${puntosRequeridos}.`,
      );
    }

    const fechaOperacion = new Date();

    return await this.prisma.$transaction(async (tx) => {
      const voucherCreado = await tx.voucher.create({
        data: {
          idCliente,
          idVoucherTipo: voucherTipo.idVoucherTipo,
          estadoVoucher: ESTADO.ADQUIRIDO,
          fechaAdquisicion: fechaOperacion,
        },
        include: {
          voucherTipo: {
            select: {
              idVoucherTipo: true,
              titulo: true,
            },
          },
        },
      });

      await tx.movimientoPuntos.create({
        data: {
          idCliente,
          fecha: fechaOperacion,
          tipo: TIPO_MOVIMIENTO.DEBITO,
          origen: ORIGEN_MOVIMIENTO.VOUCHER,
          puntos: puntosRequeridos,
          descripcion: `Canje de voucher: ${voucherTipo.titulo}`,
          idVoucher: voucherCreado.idVoucher,
        },
      });

      await tx.cliente.update({
        where: { idCliente },
        data: {
          puntos: {
            decrement: puntosRequeridos,
          },
        },
      });

      const clienteActualizado = await tx.cliente.findUnique({
        where: { idCliente },
        select: {
          idCliente: true,
          puntos: true,
        },
      });

      return {
        message: 'Voucher adquirido correctamente',
        voucher: voucherCreado,
        puntosDebitados: puntosRequeridos,
        puntosDisponibles: Number(clienteActualizado?.puntos ?? 0),
      };
    });
  }

  async anularVoucherCliente(idVoucher: number, ctx: ActorCtx) {
    if (ctx.actorRole !== 'CLIENTE') {
      throw new ForbiddenException('Solo un cliente puede anular vouchers desde este endpoint.');
    }

    const idCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);

    const voucher = await this.prisma.voucher.findUnique({
      where: { idVoucher },
      include: {
        voucherTipo: true,
      },
    });

    if (!voucher) {
      throw new NotFoundException('Voucher no encontrado');
    }

    if (Number(voucher.idCliente) !== Number(idCliente)) {
      throw new ForbiddenException('No tenés permiso para anular este voucher');
    }

    if (Number(voucher.estadoVoucher) === ESTADO.ANULADO) {
      throw new BadRequestException('El voucher ya se encuentra anulado.');
    }

    if (Number(voucher.estadoVoucher) === ESTADO.UTILIZADO) {
      throw new BadRequestException('No se puede anular un voucher ya utilizado.');
    }

    if (Number(voucher.estadoVoucher) !== ESTADO.ADQUIRIDO) {
      throw new BadRequestException('Solo se pueden anular vouchers en estado ADQUIRIDO.');
    }

    const puntosAReintegrar = Number(voucher.voucherTipo?.puntosRequeridos ?? 0);
    const fechaOperacion = new Date();

    return await this.prisma.$transaction(async (tx) => {
      const voucherActualizado = await tx.voucher.update({
        where: { idVoucher },
        data: {
          estadoVoucher: ESTADO.ANULADO,
        },
        include: {
          voucherTipo: {
            select: {
              idVoucherTipo: true,
              titulo: true,
            },
          },
        },
      });

      await tx.movimientoPuntos.create({
        data: {
          idCliente,
          fecha: fechaOperacion,
          tipo: TIPO_MOVIMIENTO.CREDITO,
          origen: ORIGEN_MOVIMIENTO.VOUCHER,
          puntos: puntosAReintegrar,
          descripcion: `Reintegro por anulación de voucher: ${voucher.voucherTipo?.titulo ?? 'Voucher'}`,
          idVoucher: voucherActualizado.idVoucher,
        },
      });

      await tx.cliente.update({
        where: { idCliente },
        data: {
          puntos: {
            increment: puntosAReintegrar,
          },
        },
      });

      const clienteActualizado = await tx.cliente.findUnique({
        where: { idCliente },
        select: {
          idCliente: true,
          puntos: true,
        },
      });

      return {
        message: 'Voucher anulado correctamente',
        voucher: voucherActualizado,
        puntosReintegrados: puntosAReintegrar,
        puntosDisponibles: Number(clienteActualizado?.puntos ?? 0),
      };
    });
  }
}
