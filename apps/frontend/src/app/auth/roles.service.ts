import { Injectable } from '@angular/core';
import { keycloak } from './keycloak';
import { AppRoleService } from './app-role.service';

type KCParsed = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
} & Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class RolesService {
  constructor(private appRole: AppRoleService) {}

  private norm(role?: string) {
    return (role ?? '').trim().toUpperCase();
  }

  private allRolesFromJwt(): Set<string> {
    const t = keycloak.tokenParsed as KCParsed | undefined;
    const out = new Set<string>();

    const realm = t?.realm_access?.roles ?? [];
    for (const r of realm) out.add(this.norm(r));

    const res = t?.resource_access ?? {};
    for (const client of Object.values(res)) {
      const roles = client?.roles ?? [];
      for (const r of roles) out.add(this.norm(r));
    }

    return out;
  }

  hasRole(role: string): boolean {
    if (!role) return false;

    //1-Primero, roles reales del JWT
    const jwtHas = this.allRolesFromJwt().has(this.norm(role));
    if (jwtHas) return true;

    //2-Fallback: mapear rol de BD a nombre de rol
    return this.appRole.matchesRoleName(role);
  }

  hasAnyRole(roles: string[]): boolean {
    if (!roles?.length) return false;

    // 1- JWT
    const all = this.allRolesFromJwt();
    if (roles.some((r) => all.has(this.norm(r)))) return true;

    // 2- Fallback BD
    return this.appRole.matchesAny(roles);
  }

  list(): string[] {
    // lista visible combinada: JWT + fallback
    const out = this.allRolesFromJwt();

    const id = this.appRole.currentId();
    if (id === 1) { out.add('ADMIN'); out.add('ADMINISTRADOR'); }
    if (id === 2) out.add('OPERARIO');
    if (id === 3) out.add('CLIENTE');

    return Array.from(out);
  }
}
