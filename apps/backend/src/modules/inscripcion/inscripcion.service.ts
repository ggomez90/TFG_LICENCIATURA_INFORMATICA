import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, InscripcionDesafio, Usuario } from '@prisma/client';

import { CreateInscripcionDesafioDto } from './create-inscripcion-desafio.dto';
import { UpdateInscripcionDesafioDto } from './update-inscripcion-desafio.dto';
import { UpdateEstadoInscripcionDto } from './update-estado-inscripcion.dto';
import { FilterInscripcionDto } from './filter-inscripcion.dto';

type ActorCtx = {
  actorRole: 'ADMIN' | 'OPERARIO' | 'CLIENTE';
  identifier: string;
};

@Injectable()
export class InscripcionService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'inscripcionDesafio' as const;
  private readonly ID_FIELD = 'idInscripcionDesafio' as const;

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

  //create (ADMIN o CLIENTE)
  async create(dto: CreateInscripcionDesafioDto, ctx: ActorCtx): Promise<InscripcionDesafio> {
    if (!['ADMIN', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para crear inscripciones.');
    }

    const data: any = { ...dto };

    // Si quien crea es CLIENTE va su propio idCliente
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (dto.idCliente !== myIdCliente) {
        data.idCliente = myIdCliente;
      }
    }

    // fechas
    if (dto.fechaAdhesion) data.fechaAdhesion = new Date(dto.fechaAdhesion);
    if (dto.fechaBaja) data.fechaBaja = new Date(dto.fechaBaja);

    try {
      return await (this.prisma as any)[this.MODEL].create({ data });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (Cliente/Desafio/Estado/Tipo/Rol).');
      }
      throw error;
    }
  }

  //findAll
  async findAll(filter: FilterInscripcionDto, ctx: ActorCtx) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'idInscripcionDesafio',
      order = 'desc',
      idInscripcionDesafio,
      idCliente,
      idDesafio,
      idEstadoDesafio,
      idTipoCliente,
      idRolUsuario,
    } = filter as any;

    const where: Prisma.InscripcionDesafioWhereInput = {};

    if (ctx.actorRole === 'CLIENTE') {
      // Cliente solo ve sus inscripciones
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      where.idCliente = myIdCliente;
    } else {
      if (idCliente) where.idCliente = Number(idCliente);
    }

    if (idInscripcionDesafio) (where as any).idInscripcionDesafio = Number(idInscripcionDesafio);
    if (idDesafio) where.idDesafio = Number(idDesafio);
    if (idEstadoDesafio) (where as any).idEstadoDesafio = Number(idEstadoDesafio);
    if (idTipoCliente) (where as any).idTipoCliente = Number(idTipoCliente);
    if (idRolUsuario) (where as any).idRolUsuario = Number(idRolUsuario);

    const sortField = (sortBy ?? 'idInscripcionDesafio') as keyof Prisma.InscripcionDesafioOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.InscripcionDesafioOrderByWithRelationInput = { [sortField]: sortOrder };

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

  //update (ADMIN o CLIENTE)
  async update(idInscripcionDesafio: number, dto: UpdateInscripcionDesafioDto, ctx: ActorCtx): Promise<InscripcionDesafio> {
    if (!['ADMIN', 'CLIENTE'].includes(ctx.actorRole)) {
      throw new ForbiddenException('No autorizado para actualizar inscripciones.');
    }

    const current = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idInscripcionDesafio },
    });
    if (!current) throw new NotFoundException('Inscripción no encontrada');

    // Si es CLIENTE solo su propia inscripción
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (current.idCliente !== myIdCliente) {
        throw new ForbiddenException('No autorizado para actualizar esta inscripción.');
      }
    }

    const data: any = { ...dto };
    if (dto.fechaAdhesion) data.fechaAdhesion = new Date(dto.fechaAdhesion as any);
    if (dto.fechaBaja) data.fechaBaja = new Date(dto.fechaBaja as any);

    try {
      return await (this.prisma as any)[this.MODEL].update({
        where: { [this.ID_FIELD]: idInscripcionDesafio },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (Cliente/Desafio/Estado/Tipo/Rol).');
      }
      throw error;
    }
  }

  //updateEstado (ADMIN o CLIENTE)
  async updateEstado(idInscripcionDesafio: number, dto: UpdateEstadoInscripcionDto, ctx: ActorCtx): Promise<InscripcionDesafio> {
    const current = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idInscripcionDesafio },
    });
    if (!current) throw new NotFoundException('Inscripción no encontrada');

    // Si es CLIENTE solo su propia inscripción
    if (ctx.actorRole === 'CLIENTE') {
      const myIdCliente = await this.resolveClienteIdFromIdentifier(ctx.identifier);
      if (current.idCliente !== myIdCliente) {
        throw new ForbiddenException('No autorizado para cambiar el estado de esta inscripción.');
      }
    }

    const data: any = {
      idEstadoDesafio: Number(dto.idEstadoDesafio),
    };

    return await (this.prisma as any)[this.MODEL].update({
      where: { [this.ID_FIELD]: idInscripcionDesafio },
      data,
    });
  }
}
