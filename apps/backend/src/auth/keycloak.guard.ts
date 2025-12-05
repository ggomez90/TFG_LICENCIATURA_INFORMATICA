import { Injectable, ExecutionContext, Inject } from '@nestjs/common';
import { AuthGuard } from 'nest-keycloak-connect';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KeycloakAuthGuard extends AuthGuard {
  // Inyeccion por propiedad para evitar definir constructor y no tener que llamar al metodo super() que tira error
  @Inject(PrismaService)
  private readonly prisma!: PrismaService;

  // Activate para pasar de PENDIENTE (1) a HABILITADO (2) en el primer request autenticado con email verificado
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const can = await super.canActivate(context);
    if (!can) return false;

    const req = context.switchToHttp().getRequest();
    const user = req?.user;
    if (!user || user.email_verified !== true) return true;

    const identifier: string | undefined =
      user?.preferred_username ?? user?.email ?? user?.username;
    if (!identifier) return true;

    const isEmail = identifier.includes('@');

    try {
      const dbUser = await this.prisma.usuario.findUnique({
        where: isEmail ? { email: identifier } : { usuario: identifier },
        select: { idUsuario: true, idEstadoUsuario: true },
      });

      if (dbUser?.idEstadoUsuario === 1) {
        await this.prisma.usuario.update({
          where: { idUsuario: dbUser.idUsuario },
          data: { idEstadoUsuario: 2 },
        });
      }
    } catch {
      // catch vacio por si la request si falla
    }

    return true;
  }
}
