// apps/backend/src/auth/keycloak-admin.service.ts
import { Injectable } from '@nestjs/common';

/**
 * Servicio mínimo para hablar con la Admin REST API de Keycloak.
 * Usa fetch nativo (Node 18+).
 */
@Injectable()
export class KeycloakAdminService {
  private base = process.env.KEYCLOAK_URL?.replace(/\/+$/, '') || 'http://keycloak:8081';
  private realm = process.env.KEYCLOAK_REALM || 'yo-reciclo';
  private adminUser = process.env.KEYCLOAK_ADMIN_USER || 'admin';
  private adminPass = process.env.KEYCLOAK_ADMIN_PASS || 'admin';
  private adminClientId = 'admin-cli';

  private async formPost(url: string, body: Record<string, string>) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body).toString(),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`POST ${url} -> ${res.status} ${res.statusText} ${txt}`);
    }
    return res.json();
  }

  private async getJson(url: string, token: string) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GET ${url} -> ${res.status} ${res.statusText} ${txt}`);
    }
    return res.json();
  }

  private async postJson(url: string, token: string, json: unknown) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`POST ${url} -> ${res.status} ${res.statusText} ${txt}`);
    }
    return res.text(); // KC suele devolver vacío (204/201)
  }

  private async getAdminToken(): Promise<string> {
    const url = `${this.base}/realms/master/protocol/openid-connect/token`;
    const data = await this.formPost(url, {
      grant_type: 'password',
      client_id: this.adminClientId,
      username: this.adminUser,
      password: this.adminPass,
    });
    return data.access_token as string;
  }

  private async getUserIdByUsername(username: string, token: string): Promise<string | null> {
    const url = `${this.base}/admin/realms/${this.realm}/users?username=${encodeURIComponent(username)}&exact=true`;
    const arr = await this.getJson(url, token);
    const user = Array.isArray(arr) ? arr[0] : null;
    return user?.id ?? null;
  }

  private async getRoleByName(roleName: string, token: string): Promise<any> {
    const url = `${this.base}/admin/realms/${this.realm}/roles/${encodeURIComponent(roleName)}`;
    return this.getJson(url, token);
  }

private async addRealmRoleToUser(userId: string, roleRep: any, token: string) {
  const url = `${this.base}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([roleRep]),
  });

  if (res.ok) return res.text();

  // Keycloak a veces devuelve 400/409 cuando el rol ya está asignado.
  const txt = await res.text();
  const lower = txt.toLowerCase();
  const looksLikeDuplicate =
    res.status === 409 ||
    (res.status === 400 &&
      (lower.includes('duplicate') ||
       lower.includes('already') ||
       lower.includes('could not add user role mappings')));

  if (looksLikeDuplicate) {
    // No lo tratamos como error: ya estaba asignado, seguimos.
    return '';
  }

  throw new Error(`POST ${url} -> ${res.status} ${res.statusText} ${txt}`);
}


  /**
   * Asegura que el usuario (por username) tenga el rol de realm indicado.
   * Si ya lo tiene, KC lo ignora; si no, lo asigna.
   */
  async ensureUserHasRole(username: string, roleName: string): Promise<void> {
    const token = await this.getAdminToken();

    const userId = await this.getUserIdByUsername(username, token);
    if (!userId) {
      throw new Error(`KC user not found for username "${username}"`);
    }

    const role = await this.getRoleByName(roleName, token);
    if (!role || !role.id) {
      throw new Error(`KC role "${roleName}" not found`);
    }

    await this.addRealmRoleToUser(userId, { id: role.id, name: role.name }, token);
  }
}
