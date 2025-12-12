import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, VoucherTipo } from '@prisma/client';

import { CreateVoucherTipoDto } from './create-voucher-tipo.dto';
import { UpdateVoucherTipoDto } from './update-voucher-tipo.dto';
import { UpdateActivaVoucherTipoDto } from './update-activa-voucher-tipo.dto';
import { FilterVoucherTipoDto } from './filter-voucher-tipo.dto';

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

  // List (ADMIN)
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

  // Create (legacy: si alguna vez lo usás directo)
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

  // Update (ADMIN)
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

  // Update activa (ADMIN)
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
}
