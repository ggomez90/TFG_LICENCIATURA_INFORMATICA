// apps/frontend/src/app/auth/role.guard.ts
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { inject } from '@angular/core';
import { RolesService } from './roles.service';

export const hasRoleGuard: CanActivateFn = (route): boolean | UrlTree => {
  const rolesRequeridos = (route.data?.['roles'] as string[]) ?? [];
  const roles = inject(RolesService);
  const ok = rolesRequeridos.length === 0 || roles.hasAnyRole(rolesRequeridos);
  return ok ? true : inject(Router).parseUrl('/forbidden');
};
