import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// DTOs
import { CreateEstadoDesafioDto, UpdateEstadoDesafioDto, FilterEstadoDesafioDto } from './estado-desafio.dto';
import { CreateEstadoEntregaDto, UpdateEstadoEntregaDto, FilterEstadoEntregaDto } from './estado-entrega.dto';
import { CreateEstadoUsuarioDto, UpdateEstadoUsuarioDto, FilterEstadoUsuarioDto } from './estado-usuario.dto';
import { CreateEstadoVoucherDto, UpdateEstadoVoucherDto, FilterEstadoVoucherDto } from './estado-voucher.dto';
import { CreateRolUsuarioDto, UpdateRolUsuarioDto, FilterRolUsuarioDto } from './rol-usuario.dto';
import { CreateTipoMovimientoDto, UpdateTipoMovimientoDto, FilterTipoMovimientoDto } from './tipo-movimiento.dto';
import { CreateOrigenMovimientoDto, UpdateOrigenMovimientoDto, FilterOrigenMovimientoDto } from './origen-movimiento.dto';

@Injectable()
export class CatalogosService {
  constructor(private readonly prisma: PrismaService) {}

  //helpers comunes
  private buildPagination(q: { page?: number; pageSize?: number }) {
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(q.pageSize) || 50));
    const skip = (page - 1) * pageSize;
    const take = pageSize;
    return { page, pageSize, skip, take };
  }

  private buildOrder(order?: 'ASC' | 'DESC', sortByFallback = 'descripcion') {
    const dir = (order || 'ASC').toLowerCase() === 'desc' ? 'desc' : 'asc';
    return { orderBy: { [sortByFallback]: dir as 'asc' | 'desc' } };
  }

  //EstadoDesafio
  async listEstadoDesafio(q: FilterEstadoDesafioDto) {
    const { skip, take } = this.buildPagination(q);
    const where = q.q ? { descripcion: { contains: q.q } } : {};
    const orderBy = this.buildOrder(q.order, q.sortBy || 'descripcion').orderBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.estadoDesafio.findMany({ where, skip, take, orderBy }),
      this.prisma.estadoDesafio.count({ where }),
    ]);
    return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 50 };
  }
  async getEstadoDesafio(id: number) {
    const item = await this.prisma.estadoDesafio.findUnique({ where: { idEstadoDesafio: id } });
    if (!item) throw new NotFoundException('EstadoDesafio no encontrado');
    return item;
  }
  async createEstadoDesafio(dto: CreateEstadoDesafioDto) {
    return this.prisma.estadoDesafio.create({ data: { idEstadoDesafio: dto.idEstadoDesafio, descripcion: dto.descripcion } });
  }
  async updateEstadoDesafio(id: number, dto: UpdateEstadoDesafioDto) {
    await this.getEstadoDesafio(id);
    return this.prisma.estadoDesafio.update({
      where: { idEstadoDesafio: id },
      data: { descripcion: dto.descripcion ?? undefined },
    });
  }

  // EstadoEntrega
  async listEstadoEntrega(q: FilterEstadoEntregaDto) {
    const { skip, take } = this.buildPagination(q);
    const where = q.q ? { descripcion: { contains: q.q } } : {};
    const orderBy = this.buildOrder(q.order, q.sortBy || 'descripcion').orderBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.estadoEntrega.findMany({ where, skip, take, orderBy }),
      this.prisma.estadoEntrega.count({ where }),
    ]);
    return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 50 };
  }
  async getEstadoEntrega(id: number) {
    const item = await this.prisma.estadoEntrega.findUnique({ where: { idEstadoEntrega: id } });
    if (!item) throw new NotFoundException('EstadoEntrega no encontrado');
    return item;
  }
  async createEstadoEntrega(dto: CreateEstadoEntregaDto) {
    return this.prisma.estadoEntrega.create({ data: { idEstadoEntrega: dto.idEstadoEntrega, descripcion: dto.descripcion } });
  }
  async updateEstadoEntrega(id: number, dto: UpdateEstadoEntregaDto) {
    await this.getEstadoEntrega(id);
    return this.prisma.estadoEntrega.update({
      where: { idEstadoEntrega: id },
      data: { descripcion: dto.descripcion ?? undefined },
    });
  }

  //EstadoUsuario
  async listEstadoUsuario(q: FilterEstadoUsuarioDto) {
    const { skip, take } = this.buildPagination(q);
    const where = q.q ? { descripcion: { contains: q.q } } : {};
    const orderBy = this.buildOrder(q.order, q.sortBy || 'descripcion').orderBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.estadoUsuario.findMany({ where, skip, take, orderBy }),
      this.prisma.estadoUsuario.count({ where }),
    ]);
    return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 50 };
  }
  async getEstadoUsuario(id: number) {
    const item = await this.prisma.estadoUsuario.findUnique({ where: { idEstadoUsuario: id } });
    if (!item) throw new NotFoundException('EstadoUsuario no encontrado');
    return item;
  }
  async createEstadoUsuario(dto: CreateEstadoUsuarioDto) {
    return this.prisma.estadoUsuario.create({ data: { idEstadoUsuario: dto.idEstadoUsuario, descripcion: dto.descripcion } });
  }
  async updateEstadoUsuario(id: number, dto: UpdateEstadoUsuarioDto) {
    await this.getEstadoUsuario(id);
    return this.prisma.estadoUsuario.update({
      where: { idEstadoUsuario: id },
      data: { descripcion: dto.descripcion ?? undefined },
    });
  }

  //EstadoVoucher
  async listEstadoVoucher(q: FilterEstadoVoucherDto) {
    const { skip, take } = this.buildPagination(q);
    const where = q.q ? { descripcion: { contains: q.q } } : {};
    const orderBy = this.buildOrder(q.order, q.sortBy || 'descripcion').orderBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.estadoVoucher.findMany({ where, skip, take, orderBy }),
      this.prisma.estadoVoucher.count({ where }),
    ]);
    return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 50 };
  }
  async getEstadoVoucher(id: number) {
    const item = await this.prisma.estadoVoucher.findUnique({ where: { idEstadoVoucher: id } });
    if (!item) throw new NotFoundException('EstadoVoucher no encontrado');
    return item;
  }
  async createEstadoVoucher(dto: CreateEstadoVoucherDto) {
    return this.prisma.estadoVoucher.create({ data: { idEstadoVoucher: dto.idEstadoVoucher, descripcion: dto.descripcion } });
  }
  async updateEstadoVoucher(id: number, dto: UpdateEstadoVoucherDto) {
    await this.getEstadoVoucher(id);
    return this.prisma.estadoVoucher.update({
      where: { idEstadoVoucher: id },
      data: { descripcion: dto.descripcion ?? undefined },
    });
  }

  //RolUsuario
  async listRolUsuario(q: FilterRolUsuarioDto) {
    const { skip, take } = this.buildPagination(q);
    const where = q.q ? { descripcion: { contains: q.q } } : {};
    const orderBy = this.buildOrder(q.order, q.sortBy || 'descripcion').orderBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.rolUsuario.findMany({ where, skip, take, orderBy }),
      this.prisma.rolUsuario.count({ where }),
    ]);
    return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 50 };
  }
  async getRolUsuario(id: number) {
    const item = await this.prisma.rolUsuario.findUnique({ where: { idRolUsuario: id } });
    if (!item) throw new NotFoundException('RolUsuario no encontrado');
    return item;
  }
  async createRolUsuario(dto: CreateRolUsuarioDto) {
    return this.prisma.rolUsuario.create({ data: { idRolUsuario: dto.idRolUsuario, descripcion: dto.descripcion } });
  }
  async updateRolUsuario(id: number, dto: UpdateRolUsuarioDto) {
    await this.getRolUsuario(id);
    return this.prisma.rolUsuario.update({
      where: { idRolUsuario: id },
      data: { descripcion: dto.descripcion ?? undefined },
    });
  }

  //TipoMovimiento
  async listTipoMovimiento(q: FilterTipoMovimientoDto) {
    const { skip, take } = this.buildPagination(q);
    const where = q.q ? { descripcion: { contains: q.q } } : {};
    const orderBy = this.buildOrder(q.order, q.sortBy || 'descripcion').orderBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.tipoMovimiento.findMany({ where, skip, take, orderBy }),
      this.prisma.tipoMovimiento.count({ where }),
    ]);
    return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 50 };
  }
  async getTipoMovimiento(id: number) {
    const item = await this.prisma.tipoMovimiento.findUnique({ where: { idTipoMovimiento: id } });
    if (!item) throw new NotFoundException('TipoMovimiento no encontrado');
    return item;
  }
  async createTipoMovimiento(dto: CreateTipoMovimientoDto) {
    return this.prisma.tipoMovimiento.create({ data: { idTipoMovimiento: dto.idTipoMovimiento, descripcion: dto.descripcion } });
  }
  async updateTipoMovimiento(id: number, dto: UpdateTipoMovimientoDto) {
    await this.getTipoMovimiento(id);
    return this.prisma.tipoMovimiento.update({
      where: { idTipoMovimiento: id },
      data: { descripcion: dto.descripcion ?? undefined },
    });
  }

  //OrigenMovimiento
  async listOrigenMovimiento(q: FilterOrigenMovimientoDto) {
    const { skip, take } = this.buildPagination(q);
    const where = q.q ? { descripcion: { contains: q.q } } : {};
    const orderBy = this.buildOrder(q.order, q.sortBy || 'descripcion').orderBy;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.origenMovimiento.findMany({ where, skip, take, orderBy }),
      this.prisma.origenMovimiento.count({ where }),
    ]);
    return { items, total, page: q.page ?? 1, pageSize: q.pageSize ?? 50 };
  }
  async getOrigenMovimiento(id: number) {
    const item = await this.prisma.origenMovimiento.findUnique({ where: { idOrigenMovimiento: id } });
    if (!item) throw new NotFoundException('OrigenMovimiento no encontrado');
    return item;
  }
  async createOrigenMovimiento(dto: CreateOrigenMovimientoDto) {
    return this.prisma.origenMovimiento.create({ data: { idOrigenMovimiento: dto.idOrigenMovimiento, descripcion: dto.descripcion } });
  }
  async updateOrigenMovimiento(id: number, dto: UpdateOrigenMovimientoDto) {
    await this.getOrigenMovimiento(id);
    return this.prisma.origenMovimiento.update({
      where: { idOrigenMovimiento: id },
      data: { descripcion: dto.descripcion ?? undefined },
    });
  }
}
