import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsuarioNotificacionMetaService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveUsuarioActual(authUser: any) {
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
        email: true,
        usuario: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario autenticado no encontrado.');
    }

    return usuario;
  }

  async getEstado(authUser: any) {
    const usuario = await this.resolveUsuarioActual(authUser);

    const meta = await this.prisma.usuarioNotificacionMeta.findUnique({
      where: { idUsuario: usuario.idUsuario },
      select: {
        idUsuario: true,
        ultimaNotificacionVistaAt: true,
      },
    });

    const ultimaVista = meta?.ultimaNotificacionVistaAt ?? new Date(0);

    const cantidadNuevas = await this.prisma.notificacion.count({
      where: {
        visible: true,
        idRolUsuario: usuario.idRolUsuario,
        fechaCreacion: {
          gt: ultimaVista,
        },
      },
    });

    return {
      idUsuario: usuario.idUsuario,
      ultimaNotificacionVistaAt: meta?.ultimaNotificacionVistaAt ?? null,
      hayNovedades: cantidadNuevas > 0,
      cantidadNuevas,
    };
  }

  async marcarVista(authUser: any) {
    const usuario = await this.resolveUsuarioActual(authUser);
    const ahora = new Date();

    const meta = await this.prisma.usuarioNotificacionMeta.upsert({
      where: { idUsuario: usuario.idUsuario },
      update: {
        ultimaNotificacionVistaAt: ahora,
      },
      create: {
        idUsuario: usuario.idUsuario,
        ultimaNotificacionVistaAt: ahora,
      },
      select: {
        idUsuario: true,
        ultimaNotificacionVistaAt: true,
      },
    });

    return {
      ok: true,
      ...meta,
    };
  }
}