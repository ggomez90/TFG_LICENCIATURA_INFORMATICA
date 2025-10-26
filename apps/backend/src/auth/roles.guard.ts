import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, Role } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lee los roles requeridos puestos por @Roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    // Extrae roles del token de Keycloak (realm + client)
    const realmRoles: string[] = user?.realm_access?.roles ?? [];
    const clientId = process.env.KEYCLOAK_CLIENT_ID || 'api-yo-reciclo';
    const clientRoles: string[] = user?.resource_access?.[clientId]?.roles ?? [];

    const tokenRoles = new Set<string>([...realmRoles, ...clientRoles]);

    // Autoriza si el usuario tiene al menos uno de los roles requeridos
    return requiredRoles.some((r) => tokenRoles.has(r));
  }
}
