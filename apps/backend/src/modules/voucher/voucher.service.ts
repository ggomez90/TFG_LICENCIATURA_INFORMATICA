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

type ActorCtx = {
  actorRole: 'ADMIN' | 'CLIENTE';
  identifier: string;
};

// ID de tabla catálogo
const ESTADO = {
  CREADO: 1,
  ADQUIRIDO: 2,
  UTILIZADO: 3,
  ANULADO: 4,
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

  private isTransitionAllowed(
    role: 'ADMIN' | 'CLIENTE',
    from: number,
    to: number,
  ): boolean {
    const cliente: Array<[number, number]> = [
      [ESTADO.CREADO, ESTADO.ADQUIRIDO],
      [ESTADO.CREADO, ESTADO.ANULADO],
      [ESTADO.ADQUIRIDO, ESTADO.CREADO],
    ];

    const admin: Array<[number, number]> = [
      ...cliente,
      [ESTADO.ADQUIRIDO, ESTADO.UTILIZADO],
      [ESTADO.UTILIZADO, ESTADO.ADQUIRIDO],
    ];

    const allowed = role === 'ADMIN' ? admin : cliente;
    return allowed.some(([f, t]) => f === from && t === to);
  }

  //Create
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

  //List
  async findAll(filter: FilterVoucherDto, ctx: ActorCtx) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaAdquisicion',
      order = 'desc',
      idVoucher,
      idCliente,
      idEstadoVoucher,
    } = filter as any;

    const where: Prisma.VoucherWhereInput = {};

    if (idVoucher) (where as any).idVoucher = Number(idVoucher);

    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      where.idCliente = myIdCliente;
    } else {
      if (idCliente) where.idCliente = Number(idCliente);
    }

    if (idEstadoVoucher) (where as any).idEstadoVoucher = Number(idEstadoVoucher);

    const sortField = (sortBy ?? 'fechaAdquisicion') as keyof Prisma.VoucherOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.VoucherOrderByWithRelationInput = { [sortField]: sortOrder };

    const take = Number(limit);
    const skip = Number(offset);

    const [items, total] = await this.prisma.$transaction([
      (this.prisma as any)[this.MODEL].findMany({ where, skip, take, orderBy }),
      (this.prisma as any)[this.MODEL].count({ where }),
    ]);

    return { items, total, limit: take, offset: skip, sortBy, order: sortOrder };
  }

  //Update Estado
  async updateEstado(idVoucher: number, dto: UpdateEstadoVoucherDto, ctx: ActorCtx): Promise<Voucher> {
    if (!['ADMIN', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para cambiar estado de vouchers.');
    }

    const current = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idVoucher },
    });
    if (!current) throw new NotFoundException('Voucher no encontrado');

    // Cliente solo sus vouchers
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (current.idCliente !== myIdCliente) {
        throw new ForbiddenException('No autorizado para cambiar el estado de este voucher.');
      }
    }

    const from = Number(current.idEstadoVoucher ?? current.estadoVoucher ?? 0);
    const to = Number(dto.idEstadoVoucher);

    if (!this.isTransitionAllowed(ctx.actorRole, from, to)) {
      throw new ForbiddenException(`Transición de estado no permitida (${from} → ${to}) para rol ${ctx.actorRole}.`);
    }

    const data: any = { idEstadoVoucher: to };
    return await (this.prisma as any)[this.MODEL].update({
      where: { [this.ID_FIELD]: idVoucher },
      data,
    });
  }
}
