import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, RespuestaEncuesta, Usuario } from '@prisma/client';

import { CreateRespuestaEncuestaDto } from './create-respuesta-encuesta.dto';
import { UpdateRespuestaEncuestaDto } from './update-respuesta-encuesta.dto';
import { FilterRespuestaDto } from './filter-respuesta.dto';

type ActorCtx = { identifier: string }; // preferred_username | email | username | sub

@Injectable()
export class RespuestaService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'respuestaEncuesta' as const;
  private readonly ID_FIELD = 'idRespuesta' as const;

  // ---------- helpers: usuario ----------
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

  private async resolveMyUserId(ctx: ActorCtx): Promise<number> {
    const u = await this.findUsuarioByIdentifier(ctx.identifier);
    return u.idUsuario;
  }

  private async isAdmin(ctx: ActorCtx): Promise<boolean> {
    // Regla dada: admin si idUsuario === 1
    const myId = await this.resolveMyUserId(ctx);
    return myId === 1;
  }

  // ---------- Create público ----------
  async create(dto: CreateRespuestaEncuestaDto): Promise<RespuestaEncuesta> {
    const data: any = { ...dto };
    if (dto.fechaRespuesta) data.fechaRespuesta = new Date(dto.fechaRespuesta);

    // Si llega idUsuario, opcionalmente podés validar que exista:
    if (dto.idUsuario) {
      const exists = await this.prisma.usuario.findUnique({ where: { idUsuario: dto.idUsuario } });
      if (!exists) throw new BadRequestException('idUsuario no válido.');
    }

    try {
      return await (this.prisma as any)[this.MODEL].create({ data });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (idEncuesta / idUsuario).');
      }
      throw error;
    }
  }

  // ---------- List (login requerido) ----------
  async findAll(filter: FilterRespuestaDto, ctx: ActorCtx) {
    const {
      limit = 20,
      offset = 0,
      sortBy = 'fechaRespuesta',
      order = 'desc',
      idEncuesta,
      idUsuario,
      invitado,
      desde,
      hasta,
      contenidoLike,
    } = filter as any;

    const where: Prisma.RespuestaEncuestaWhereInput = {};

    const admin = await this.isAdmin(ctx);
    if (admin) {
      if (idUsuario) (where as any).idUsuario = Number(idUsuario);
    } else {
      // usuario común: solo sus respuestas
      const myId = await this.resolveMyUserId(ctx);
      (where as any).idUsuario = myId;
    }

    if (idEncuesta) (where as any).idEncuesta = Number(idEncuesta);

    if (typeof invitado === 'boolean') {
    if (invitado) {
        where.datosInvitado = { not: null };
         } else {
        where.datosInvitado = null;
        }
    }


    if (desde || hasta) {
      (where as any).fechaRespuesta = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta) } : {}),
      };
    }

    if (contenidoLike) {
      where.contenido = { contains: String(contenidoLike) };
    }

    const sortField = (sortBy ?? 'fechaRespuesta') as keyof Prisma.RespuestaEncuestaOrderByWithRelationInput;
    const sortOrder: Prisma.SortOrder = (order ?? 'desc').toLowerCase() === 'asc' ? 'asc' : 'desc';
    const orderBy: Prisma.RespuestaEncuestaOrderByWithRelationInput = { [sortField]: sortOrder };

    const take = Number(limit);
    const skip = Number(offset);

    const [items, total] = await this.prisma.$transaction([
      (this.prisma as any)[this.MODEL].findMany({ where, skip, take, orderBy }),
      (this.prisma as any)[this.MODEL].count({ where }),
    ]);

    return { items, total, limit: take, offset: skip, sortBy, order: sortOrder };
  }

  // ---------- Update (login requerido) ----------
  async update(idRespuesta: number, dto: UpdateRespuestaEncuestaDto, ctx: ActorCtx): Promise<RespuestaEncuesta> {
    const current = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idRespuesta },
    });
    if (!current) throw new NotFoundException('Respuesta no encontrada');

    const admin = await this.isAdmin(ctx);

    if (!admin) {
      // solo el dueño puede editar; si fue invitado (null), no puede
      const myId = await this.resolveMyUserId(ctx);
      if (!current.idUsuario || current.idUsuario !== myId) {
        throw new ForbiddenException('No autorizado para editar esta respuesta.');
      }
    }

    const data: any = { ...dto };
    if (dto.fechaRespuesta) data.fechaRespuesta = new Date(dto.fechaRespuesta as any);

    try {
      return await (this.prisma as any)[this.MODEL].update({
        where: { [this.ID_FIELD]: idRespuesta },
        data,
      });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        throw new BadRequestException('Alguna referencia es inválida (idEncuesta / idUsuario).');
      }
      throw error;
    }
  }
}
