import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

import { CreateNotificacionDto } from './create-notificacion.dto';
import { UpdateNotificacionDto } from './update-notificacion.dto';
import { UpdateVisibleNotificacionDto } from './update-visible-notificacion.dto';
import { FilterNotificacionDto } from './filter-notificacion.dto';
import { ListNotificacionPublicDto } from './list-notificacion-public.dto';

@Injectable()
export class NotificacionService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'notificacion' as const;
  private readonly ID_FIELD = 'idNotificacion' as const;

  // Helpers
  private coerceCreate(dto: CreateNotificacionDto) {
    return {
      ...dto,
      visible: dto.visible ?? true,
    };
  }

  private coerceUpdate(dto: UpdateNotificacionDto) {
    return { ...dto };
  }

  private pickRole(user: any): 'OPERARIO' | 'CLIENTE' {
    const roles =
      user?.realm_access?.roles ??
      user?.resource_access?.default?.roles ??
      user?.roles ??
      [];

    if (Array.isArray(roles)) {
      if (roles.includes('OPERARIO')) return 'OPERARIO';
      return 'CLIENTE';
    }

    return 'CLIENTE';
  }

  private async resolveAdminId(authUser: any): Promise<number> {
    const email = authUser?.email ?? null;
    const username =
      authUser?.preferred_username ??
      authUser?.username ??
      authUser?.usuario ??
      null;

    if (!email && !username) {
      throw new UnauthorizedException(
        'No se pudo identificar al usuario autenticado.',
      );
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(username ? [{ usuario: username }] : []),
        ],
      },
      select: {
        idUsuario: true,
        idRolUsuario: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario administrador no encontrado.');
    }

    return usuario.idUsuario;
  }

  // ADMIN List
  async findAll(filter: FilterNotificacionDto) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaCreacion',
      order = 'desc',
      idAdmin,
      idRolUsuario,
      visible,
      desde,
      hasta,
    } = filter as any;

    const where: Prisma.NotificacionWhereInput = {};

    if (idAdmin) where.idAdmin = Number(idAdmin);
    if (idRolUsuario) where.idRolUsuario = Number(idRolUsuario);
    if (typeof visible === 'boolean') where.visible = visible;

    if (desde || hasta) {
      where.fechaCreacion = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      };
    }

    const sortField =
      (sortBy ?? 'fechaCreacion') as keyof Prisma.NotificacionOrderByWithRelationInput;

    const sortOrder: Prisma.SortOrder =
      (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';

    const orderBy: Prisma.NotificacionOrderByWithRelationInput = {
      [sortField]: sortOrder,
    };

    const take = Number(limit);
    const skip = Number(offset);

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificacion.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.notificacion.count({ where }),
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

  // ADMIN Create
  async create(authUser: any, dto: CreateNotificacionDto) {
    const idAdmin = await this.resolveAdminId(authUser);
    const data = this.coerceCreate(dto);

    try {
      return await this.prisma.notificacion.create({
        data: {
          ...data,
          idAdmin,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'Alguna referencia es inválida (idAdmin / idRolUsuario).',
        );
      }
      throw error;
    }
  }

  // ADMIN Update
  async update(idNotificacion: number, dto: UpdateNotificacionDto) {
    const exists = await this.prisma.notificacion.findUnique({
      where: { [this.ID_FIELD]: idNotificacion },
    });

    if (!exists) {
      throw new NotFoundException('Notificación no encontrada');
    }

    const data = this.coerceUpdate(dto);

    try {
      return await this.prisma.notificacion.update({
        where: { [this.ID_FIELD]: idNotificacion },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException(
          'Alguna referencia es inválida (idAdmin / idRolUsuario).',
        );
      }
      throw error;
    }
  }

  // ADMIN Update visible
  async updateVisible(idNotificacion: number, dto: UpdateVisibleNotificacionDto) {
    const exists = await this.prisma.notificacion.findUnique({
      where: { [this.ID_FIELD]: idNotificacion },
    });

    if (!exists) {
      throw new NotFoundException('Notificación no encontrada');
    }

    return this.prisma.notificacion.update({
      where: { [this.ID_FIELD]: idNotificacion },
      data: { visible: dto.visible },
      select: {
        idNotificacion: true,
        visible: true,
      },
    });
  }

  // OPERARIO/CLIENTE listado
  async listPublic(user: any, dto: ListNotificacionPublicDto) {
    const { limit = 20, offset = 0, desde, hasta } = dto as any;

    const role = this.pickRole(user);
    const idRolUsuario = role === 'OPERARIO' ? 2 : 3;

    const where: Prisma.NotificacionWhereInput = {
      visible: true,
      idRolUsuario,
      ...(desde || hasta
        ? {
            fechaCreacion: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(hasta) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notificacion.findMany({
        where,
        orderBy: { fechaCreacion: 'desc' },
        skip: Number(offset),
        take: Number(limit),
        select: {
          idNotificacion: true,
          titulo: true,
          mensaje: true,
          fechaCreacion: true,
          visible: true,
          idRolUsuario: true,
        },
      }),
      this.prisma.notificacion.count({ where }),
    ]);

    return {
      items,
      total,
      limit: Number(limit),
      offset: Number(offset),
    };
  }
}