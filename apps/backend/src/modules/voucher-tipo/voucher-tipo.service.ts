import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, VoucherTipo } from '@prisma/client';

import { CreateVoucherTipoDto } from './create-voucher-tipo.dto';
import { UpdateVoucherTipoDto } from './update-voucher-tipo.dto';
import { UpdateActivaVoucherTipoDto } from './update-activa-voucher-tipo.dto';
import { FilterVoucherTipoDto } from './filter-voucher-tipo.dto';
import { FilterVoucherTipoClienteDto } from './filter-voucher-tipo-cliente.dto';

@Injectable()
export class VoucherTipoService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'voucherTipo' as const;
  private readonly ID_FIELD = 'idVoucherTipo' as const;

  // helpers fechas
  private coerceCreate(dto: CreateVoucherTipoDto) {
    const data: any = { ...dto };
    if (dto.fechaInicioVigencia) data.fechaInicioVigencia = new Date(dto.fechaInicioVigencia);
    if (dto.fechaFinVigencia) data.fechaFinVigencia = new Date(dto.fechaFinVigencia);
    return data;
  }
  private coerceUpdate(dto: UpdateVoucherTipoDto) {
    const data: any = { ...dto };
    if (dto.fechaInicioVigencia) data.fechaInicioVigencia = new Date(dto.fechaInicioVigencia as any);
    if (dto.fechaFinVigencia) data.fechaFinVigencia = new Date(dto.fechaFinVigencia as any);
    return data;
  }

  private async findUsuarioByIdentifier(idOrIdentifier: number | string) {
    let usuario: any = null;

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

  // Listado (ADMIN)
  async findAll(filter: FilterVoucherTipoDto) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaInicioVigencia',
      order = 'desc',
      idAdmin,
      activa,
      desde,
      hasta,
    } = filter as any;

    const where: Prisma.VoucherTipoWhereInput = {};

    if (idAdmin) where.idAdmin = Number(idAdmin);
    if (typeof activa === 'boolean') where.activa = activa;

    if (desde || hasta) {
      // Rango de fechas de vigencia
      if (desde && hasta) {
        where.fechaInicioVigencia = { gte: new Date(desde) };
        where.fechaFinVigencia = { lte: new Date(hasta) };
      } else if (desde) {
        where.fechaInicioVigencia = { gte: new Date(desde) };
      } else if (hasta) {
        where.fechaFinVigencia = { lte: new Date(hasta) };
      }
    }

    const sortField = (sortBy ?? 'fechaInicioVigencia') as keyof Prisma.VoucherTipoOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.VoucherTipoOrderByWithRelationInput = { [sortField]: sortOrder };

    const take = Number(limit);
    const skip = Number(offset);

    const [items, total] = await this.prisma.$transaction([
      (this.prisma as any)[this.MODEL].findMany({ where, skip, take, orderBy }),
      (this.prisma as any)[this.MODEL].count({ where }),
    ]);

    return { items, total, limit: take, offset: skip, sortBy, order: sortOrder };
  }

  // Crear tipo de voucher
  async create(dto: CreateVoucherTipoDto): Promise<VoucherTipo> {
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

  // Update 
  async update(idVoucherTipo: number, dto: UpdateVoucherTipoDto): Promise<VoucherTipo> {
    const exists = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idVoucherTipo },
    });
    if (!exists) throw new NotFoundException('Tipo de voucher no encontrado');

    const data = this.coerceUpdate(dto);

    try {
      return await (this.prisma as any)[this.MODEL].update({
        where: { [this.ID_FIELD]: idVoucherTipo },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (idAdmin u otra FK).');
      }
      throw error;
    }
  }

  // Update activa
  async updateActiva(idVoucherTipo: number, dto: UpdateActivaVoucherTipoDto) {
    const exists = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idVoucherTipo },
    });
    if (!exists) throw new NotFoundException('Tipo de voucher no encontrado');

    return (this.prisma as any)[this.MODEL].update({
      where: { [this.ID_FIELD]: idVoucherTipo },
      data: { activa: dto.activa },
      select: { [this.ID_FIELD]: true, activa: true } as any,
    });
  }

  async findOne(idVoucherTipo: number) {
    const item = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idVoucherTipo },
    });
    if (!item) throw new NotFoundException('Tipo de voucher no encontrado');
    return item;
  }

  async findDisponiblesCliente(
    filter: FilterVoucherTipoClienteDto,
    ctx: { identifier: string },
  ) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'puntosRequeridos',
      order = 'asc',
      soloCanjeables,
    } = filter as any;

    const idCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
    const cliente = await this.getClienteConPuntos(idCliente);
    const puntosDisponibles = Number(cliente.puntos ?? 0);

    const now = new Date();

    const where: Prisma.VoucherTipoWhereInput = {
      activa: true,
      fechaInicioVigencia: { lte: now },
      fechaFinVigencia: { gte: now },
    };

    const sortField =
      (sortBy ?? 'puntosRequeridos') as keyof Prisma.VoucherTipoOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder =
      (order ?? 'asc').toLowerCase() === 'desc' ? 'desc' : 'asc';

    const orderBy: Prisma.VoucherTipoOrderByWithRelationInput = {
      [sortField]: sortOrder,
    };

    const take = Number(limit);
    const skip = Number(offset);

    const [rawItems, total] = await this.prisma.$transaction([
      this.prisma.voucherTipo.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.voucherTipo.count({ where }),
    ]);

    let items = rawItems.map((item) => {
      const puntosRequeridos = Number(item.puntosRequeridos ?? 0);
      const disponibleParaCanje = puntosDisponibles >= puntosRequeridos;
      const puntosFaltantes = Math.max(0, puntosRequeridos - puntosDisponibles);

      return {
        ...item,
        puntosDisponibles,
        disponibleParaCanje,
        puntosFaltantes,
      };
    });

    if (soloCanjeables === true) {
      items = items.filter((x) => x.disponibleParaCanje);
    }

    return {
      items,
      total: soloCanjeables === true ? items.length : total,
      limit: take,
      offset: skip,
      sortBy,
      order: sortOrder,
      puntosDisponibles,
    };
  }

  async findOneDisponibleCliente(
    idVoucherTipo: number,
    ctx: { identifier: string },
  ) {
    const idCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
    const cliente = await this.getClienteConPuntos(idCliente);
    const puntosDisponibles = Number(cliente.puntos ?? 0);

    const now = new Date();

    const item = await this.prisma.voucherTipo.findFirst({
      where: {
        idVoucherTipo,
        activa: true,
        fechaInicioVigencia: { lte: now },
        fechaFinVigencia: { gte: now },
      },
    });

    if (!item) {
      throw new NotFoundException('Tipo de voucher no disponible para cliente');
    }

    const puntosRequeridos = Number(item.puntosRequeridos ?? 0);
    const disponibleParaCanje = puntosDisponibles >= puntosRequeridos;
    const puntosFaltantes = Math.max(0, puntosRequeridos - puntosDisponibles);

    return {
      ...item,
      puntosDisponibles,
      disponibleParaCanje,
      puntosFaltantes,
    };
  }
}
