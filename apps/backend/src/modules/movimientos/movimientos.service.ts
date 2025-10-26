import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, MovimientoPuntos, Usuario } from '@prisma/client';

import { CreateMovimientoPuntosDto } from './create-movimiento-puntos.dto';
import { UpdateMovimientoPuntosDto } from './update-movimiento-puntos.dto';
import { FilterMovimientoDto } from './filter-movimiento.dto';

type ActorCtx = {
  actorRole: 'ADMIN' | 'CLIENTE';
  identifier: string;
};

const TIPO = { CREDITO: 1, DEBITO: 2 } as const;

@Injectable()
export class MovimientosService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'movimientoPuntos' as const;
  private readonly ID_FIELD = 'idMovimiento' as const;

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
    //idCliente = idUsuario (1:1)
    return usuario.idUsuario;
  }

  //signo segun tipo credito o debito
  private signByTipo(tipo: number): 1 | -1 {
    return tipo === TIPO.DEBITO ? -1 : 1; // default credito, suma
  }

  // aplica delta de puntos sobre Cliente.puntos
  private async applyBalanceDelta(clientId: number, delta: number) {
    await this.prisma.cliente.update({
      where: { idCliente: clientId },
      data: { puntos: { increment: delta } },
    });
  }

  async createFromEntrega(data: CreateMovimientoPuntosDto): Promise<MovimientoPuntos> {
    // Se espera idCliente, fecha, tipo: CREDITO, origen: ENTREGA, puntos, idEntrega?, descripcion
    return this.createAndAdjustBalance(data);
  }

  async createFromVoucher(data: CreateMovimientoPuntosDto): Promise<MovimientoPuntos> {
    // Se espera idCliente, fecha, tipo: DEBITO, origen: VOUCHER, puntos, idVoucher?, descripcion
    return this.createAndAdjustBalance(data);
  }

  async createAjusteAdmin(data: CreateMovimientoPuntosDto): Promise<MovimientoPuntos> {
    // Ajuste manual de admin (cred o deb)
    return this.createAndAdjustBalance(data);
  }

  // ADMIN Create/Update
  async createByAdmin(dto: CreateMovimientoPuntosDto): Promise<MovimientoPuntos> {
    return this.createAndAdjustBalance(dto);
  }

  async updateByAdmin(idMovimiento: number, dto: UpdateMovimientoPuntosDto): Promise<MovimientoPuntos> {
    // Leer el movimiento actual
    const current = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idMovimiento },
    });
    if (!current) throw new NotFoundException('Movimiento no encontrado');

    // Evitar cambios peligrosos de identidad
    if (dto.idCliente && dto.idCliente !== current.idCliente) {
      throw new BadRequestException('No se permite cambiar el cliente del movimiento.');
    }

    // Normalizar fechas
    const data: any = { ...dto };
    if (dto.fecha) data.fecha = new Date(dto.fecha as any);

    // Calcular delta de balance:
    // saldoNuevo = saldoViejo + (signoNuevo * puntosNuevo) - (signoViejo * puntosViejo)
    const tipoNuevo = typeof dto.tipo === 'number' ? dto.tipo : current.tipo;
    const puntosNuevo = typeof dto.puntos === 'number' ? dto.puntos : current.puntos;
    const signoNuevo = this.signByTipo(tipoNuevo);

    const signoViejo = this.signByTipo(current.tipo);
    const delta = signoNuevo * puntosNuevo - signoViejo * current.puntos;

    return await this.prisma.$transaction(async (tx) => {
      const updated = await (tx as any)[this.MODEL].update({
        where: { [this.ID_FIELD]: idMovimiento },
        data,
      });

      if (delta !== 0) {
        await tx.cliente.update({
          where: { idCliente: current.idCliente },
          data: { puntos: { increment: delta } },
        });
      }

      return updated;
    });
  }

  // Listado
  async findAll(filter: FilterMovimientoDto, ctx: ActorCtx) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fecha',
      order = 'desc',

      idCliente,
      idTipoMovimiento,
      idOrigenMovimiento,
      idEntrega,
      idVoucher,
      idAdmin,
      desde,
      hasta,
    } = filter as any;

    const where: Prisma.MovimientoPuntosWhereInput = {};

    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      where.idCliente = myIdCliente;
    } else {
      if (idCliente) where.idCliente = Number(idCliente);
    }

    if (idTipoMovimiento) (where as any).tipo = Number(idTipoMovimiento);
    if (idOrigenMovimiento) (where as any).origen = Number(idOrigenMovimiento);

    if (idEntrega) where.idEntrega = Number(idEntrega);
    if (idVoucher) where.idVoucher = Number(idVoucher);
    if (idAdmin) where.idAdmin = Number(idAdmin);

    if (desde || hasta) {
      where.fecha = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      };
    }

    const sortField = (sortBy ?? 'fecha') as keyof Prisma.MovimientoPuntosOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.MovimientoPuntosOrderByWithRelationInput = { [sortField]: sortOrder };

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

  //crea y ajusta saldo
  private async createAndAdjustBalance(dto: CreateMovimientoPuntosDto): Promise<MovimientoPuntos> {
    const data: any = { ...dto };
    if (dto.fecha) data.fecha = new Date(dto.fecha);

    const sign = this.signByTipo(dto.tipo);
    const delta = sign * Number(dto.puntos ?? 0);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await (tx as any)[this.MODEL].create({ data });

        // Ajuste del saldo del cliente
        await tx.cliente.update({
          where: { idCliente: dto.idCliente },
          data: { puntos: { increment: delta } },
        });

        return created;
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (Cliente/Entrega/Voucher/Tipo/Origen/Admin).');
      }
      throw error;
    }
  }
}
