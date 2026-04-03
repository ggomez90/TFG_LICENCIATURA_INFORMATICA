import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, RespuestaEncuesta, Usuario } from '@prisma/client';

import { CreateRespuestaEncuestaDto } from './create-respuesta-encuesta.dto';
import { UpdateRespuestaEncuestaDto } from './update-respuesta-encuesta.dto';
import { FilterRespuestaDto } from './filter-respuesta.dto';

type ActorCtx = { identifier: string };

@Injectable()
export class RespuestaService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly MODEL = 'respuestaEncuesta' as const;
  private readonly ID_FIELD = 'idRespuesta' as const;

  //helpers usuario
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
    //Es admin si idUsuario === 1
    const myId = await this.resolveMyUserId(ctx);
    return myId === 1;
  }

  private normalizeDni(input: string): string {
    return String(input ?? '').replace(/\D+/g, '').trim();
  }

  private async assertEncuestaActiva(idEncuesta: number): Promise<void> {
    const enc = await this.prisma.encuesta.findUnique({ where: { idEncuesta } });
    if (!enc) throw new NotFoundException('Encuesta no encontrada');

    // Regla: debe estar activa
    if (!enc.activa) throw new BadRequestException('La encuesta está cerrada.');

    // Regla: si fechaCierre ya pasó, también cerrada
    const now = new Date();
    if (enc.fechaCierre && enc.fechaCierre.getTime() < now.getTime()) {
      throw new BadRequestException('La encuesta está cerrada.');
    }
  }

  private async assertEncuestaNoVencida(idEncuesta: number) {
    const encuesta = await this.prisma.encuesta.findUnique({
      where: { idEncuesta },
      select: { fechaCierre: true },
    });
    if (!encuesta) throw new NotFoundException('Encuesta no encontrada');

    const cierre = new Date(encuesta.fechaCierre).getTime();
    if (!Number.isNaN(cierre) && cierre < Date.now()) {
      throw new BadRequestException('La encuesta está cerrada por fecha.');
    }
  }

  private parseDni(dni?: string | null): string | null {
    const v = String(dni ?? '').trim();
    return v ? v : null;
  }

  private async assertEncuestaAbiertaParaResponder(idEncuesta: number) {
    const encuesta = await this.prisma.encuesta.findUnique({
      where: { idEncuesta },
      select: { idEncuesta: true, activa: true, fechaCierre: true },
    });

    if (!encuesta) {
      throw new NotFoundException('Encuesta no encontrada');
    }

    if (!encuesta.activa) {
      throw new BadRequestException('La encuesta no está activa.');
    }

    const cierre = new Date(encuesta.fechaCierre);
    const now = new Date();

    // cerrada por fecha
    if (!Number.isNaN(cierre.getTime()) && cierre.getTime() < now.getTime()) {
      throw new BadRequestException('La encuesta está cerrada por fecha.');
    }
  }

  private async assertNoRespuestaPrevia(
    idEncuesta: number,
    idUsuario?: number | null,
    dniInvitado?: string | null,
  ) {
    // Si es cliente: 1 respuesta por (idEncuesta, idUsuario)
    if (idUsuario) {
      const exists = await this.prisma.respuestaEncuesta.findFirst({
        where: { idEncuesta, idUsuario },
        select: { idRespuesta: true },
      });
      if (exists) {
        throw new BadRequestException('Ya respondiste esta encuesta.');
      }
      return;
    }

    // Si es invitado: 1 respuesta por (idEncuesta, dni)
    const dni = this.parseDni(dniInvitado);
    if (dni) {
      const exists = await this.prisma.respuestaEncuesta.findFirst({
        where: { idEncuesta, dniCuilCuitInvitado: dni },
        select: { idRespuesta: true },
      });
      if (exists) {
        throw new BadRequestException('Este DNI ya respondió esta encuesta.');
      }
    }
  }

  private async assertDniInvitadoNoEsUsuario(dniInvitado?: string | null) {
    const dni = this.parseDni(dniInvitado);
    if (!dni) return;

    // Si ese DNI existe como usuario, obligamos login.
    const u = await this.prisma.usuario.findFirst({
      where: { dniCuitCuil: dni },
      select: { idUsuario: true },
    });

    if (u) {
      throw new BadRequestException('Este DNI pertenece a un usuario registrado. Por favor iniciá sesión para responder.');
    }
  }

  // CREATE INVITADO
  async createPublic(dto: CreateRespuestaEncuestaDto): Promise<RespuestaEncuesta> {
    // Validaciones base
    if (!dto?.idEncuesta) throw new BadRequestException('idEncuesta requerido.');

    // 1) Validar encuesta activa + NO vencida por fecha
    await this.assertEncuestaActiva(dto.idEncuesta); // valida activa
    await this.assertEncuestaNoVencida(dto.idEncuesta);

    // Invitado NO puede mandar idUsuario
    if (dto.idUsuario) {
      throw new BadRequestException('Un invitado no puede enviar idUsuario.');
    }

    const dni = this.normalizeDni(dto.dniCuilCuitInvitado ?? '');
    if (!dni) throw new BadRequestException('DNI requerido para invitado.');

    // Si existe usuario con ese DNI, obligar login
    const existingUser = await this.prisma.usuario.findFirst({
      where: { dniCuitCuil: dni },
      select: { idUsuario: true },
    });
    if (existingUser) {
      throw new BadRequestException(
        'Este DNI pertenece a un usuario registrado. Inicie sesión para responder.',
      );
    }

    // validar si no respondio como invitado
    const already = await this.prisma.respuestaEncuesta.findFirst({
      where: { idEncuesta: dto.idEncuesta, dniCuilCuitInvitado: dni },
      select: { idRespuesta: true },
    });
    if (already) throw new BadRequestException('Ya respondiste esta encuesta.');

    const data: any = {
      idEncuesta: dto.idEncuesta,
      datosInvitado: dto.datosInvitado ?? null,
      dniCuilCuitInvitado: dni,
      contenido: dto.contenido,
      // fechaRespuesta si viene la usamos, si no, now()
      fechaRespuesta: dto.fechaRespuesta ? new Date(dto.fechaRespuesta) : new Date(),
    };

    try {
      return await this.prisma.respuestaEncuesta.create({ data });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Ya existe una respuesta para esta encuesta.');
      }
      throw error;
    }
  }

  // CREATE LOGUEADO
  async createMine(dto: CreateRespuestaEncuestaDto, ctx: ActorCtx): Promise<RespuestaEncuesta> {
    if (!dto?.idEncuesta) throw new BadRequestException('idEncuesta requerido.');

    // 1) Validar encuesta activa + NO vencida por fecha
    await this.assertEncuestaActiva(dto.idEncuesta);
    await this.assertEncuestaNoVencida(dto.idEncuesta);

    const myId = await this.resolveMyUserId(ctx);

    // Logged NO puede mandar datos de invitado
    if (dto.datosInvitado || dto.dniCuilCuitInvitado) {
      throw new BadRequestException('No envíes datos de invitado si estás logueado.');
    }

    // validar si ya respondio
    const already = await this.prisma.respuestaEncuesta.findFirst({
      where: { idEncuesta: dto.idEncuesta, idUsuario: myId },
      select: { idRespuesta: true },
    });
    if (already) throw new BadRequestException('Ya respondiste esta encuesta.');

    const data: any = {
      idEncuesta: dto.idEncuesta,
      idUsuario: myId,
      contenido: dto.contenido,
      fechaRespuesta: dto.fechaRespuesta ? new Date(dto.fechaRespuesta) : new Date(),
    };

    try {
      return await this.prisma.respuestaEncuesta.create({ data });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new BadRequestException('Ya existe una respuesta para esta encuesta.');
      }
      throw error;
    }
  }

  //List login requerido
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
      // usuario comun solo sus respuestas
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

  //Update login requerido
  async update(idRespuesta: number, dto: UpdateRespuestaEncuestaDto, ctx: ActorCtx): Promise<RespuestaEncuesta> {
    const current = await (this.prisma as any)[this.MODEL].findUnique({
      where: { [this.ID_FIELD]: idRespuesta },
    });
    if (!current) throw new NotFoundException('Respuesta no encontrada');

    const admin = await this.isAdmin(ctx);

    if (!admin) {
      // solo el dueño puede editar, si fue invitado (null) no puede
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

  async checkPublic(idEncuesta: number, dni: string) {
    const ndni = this.normalizeDni(dni);
    if (!ndni) throw new BadRequestException('DNI inválido.');

    const item = await this.prisma.respuestaEncuesta.findFirst({
      where: { idEncuesta: Number(idEncuesta), dniCuilCuitInvitado: ndni },
      orderBy: { fechaRespuesta: 'desc' },
      select: { idRespuesta: true, contenido: true, fechaRespuesta: true },
    });

    return {
      responded: !!item,
      item: item ?? null,
    };
  }

  async findMine(idEncuesta: number, ctx: ActorCtx): Promise<RespuestaEncuesta | null> {
    const myId = await this.resolveMyUserId(ctx);

    return this.prisma.respuestaEncuesta.findFirst({
      where: {
        idEncuesta: Number(idEncuesta),
        idUsuario: myId,
      },
      orderBy: {
        fechaRespuesta: 'desc',
      },
    });
  }
}
