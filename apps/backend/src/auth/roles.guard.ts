import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  private readonly logger = new Logger(RolesGuard.name);

  canActivate(context: ExecutionContext): boolean {
    // Roles requeridos por @Roles en handler/clase
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? [];

    const req = context.switchToHttp().getRequest();
    const user = req?.user ?? {};
    const method = req?.method;
    const url = req?.originalUrl ?? req?.url;

    // Si la ruta no exige roles, permitir y loguear
    if (requiredRoles.length === 0) {
      this.logger.verbose(`ALLOW (no roles required) route=${method} ${url}`);
      return true;
    }

    // Roles del token (realm + client específico)
    const realmRoles: string[] = user?.realm_access?.roles ?? [];
    const clientId = process.env.KEYCLOAK_CLIENT_ID || 'api-yo-reciclo';
    const clientRoles: string[] = user?.resource_access?.[clientId]?.roles ?? [];
    const tokenRoles = new Set<string>([...realmRoles, ...clientRoles]);

    // Log de diagnóstico
    this.logger.warn(
      `ROLES CHECK route=${method} ${url} need=${JSON.stringify(requiredRoles)} ` +
      `have=${JSON.stringify(Array.from(tokenRoles))} ` +
      `realm=${JSON.stringify(realmRoles)} client(${clientId})=${JSON.stringify(clientRoles)}`
    );

    // Tiene al menos uno de los roles requeridos?
    const allowed = requiredRoles.some(r => tokenRoles.has(r));

    if (!allowed) {
      this.logger.warn(
        `DENY route=${method} ${url} need=${JSON.stringify(requiredRoles)} have=${JSON.stringify(Array.from(tokenRoles))}`
      );
    } else {
      this.logger.verbose(
        `ALLOW route=${method} ${url} matched=${requiredRoles.find(r => tokenRoles.has(r))}`
      );
    }

    return allowed;
  }
}
