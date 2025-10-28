import { Injectable } from '@nestjs/common';

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
    return res.text();
  }

  private async putJson(url: string, token: string, json: unknown) {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(json),
    });
    if (!res.ok && res.status !== 204) {
      const txt = await res.text();
      throw new Error(`PUT ${url} -> ${res.status} ${res.statusText} ${txt}`);
    }
    return res.text();
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

    // Keycloak devuelve 400/409 cuando el rol ya esta asignado.
    const txt = await res.text();
    const lower = txt.toLowerCase();
    const looksLikeDuplicate =
      res.status === 409 ||
      (res.status === 400 &&
        (lower.includes('duplicate') ||
         lower.includes('already') ||
         lower.includes('could not add user role mappings')));

    if (looksLikeDuplicate) {
      return '';
    }

    throw new Error(`POST ${url} -> ${res.status} ${res.statusText} ${txt}`);
  }

   // Asegura que el usuario (por username) tenga el rol de realm indicado.
   // Si ya lo tiene KC lo ignora y sino lo asigna.
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

  // Crea un usuario en KC y devuelve su id 
  async createUser(params: {
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    enabled?: boolean;
    emailVerified?: boolean;
    requiredActions?: string[]; // ['VERIFY_EMAIL','UPDATE_PASSWORD']
  }): Promise<{ id: string }> {
    const token = await this.getAdminToken();

    const payload = {
      username: params.username,
      email: params.email,
      firstName: params.firstName ?? '',
      lastName: params.lastName ?? '',
      enabled: params.enabled ?? true,
      emailVerified: params.emailVerified ?? false,
      requiredActions: params.requiredActions ?? [],
    };

    const url = `${this.base}/admin/realms/${this.realm}/users`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (res.status !== 201) {
      const txt = await res.text();
      throw new Error(`POST ${url} -> ${res.status} ${res.statusText} ${txt}`);
    }

    const location = res.headers.get('location') || '';
    const id = location.split('/').pop() ?? '';
    if (!id) throw new Error('No se pudo obtener el id del usuario creado en KC');
    return { id };
  }

  // manda email para ejecutar acciones (verificar email, actualizar password)
  async executeActionsEmail(userId: string, actions: string[]) {
    const token = await this.getAdminToken();
    const url = `${this.base}/admin/realms/${this.realm}/users/${userId}/execute-actions-email`;
    await this.putJson(url, token, actions);
  }

  // Asigna un rol de realm directo por userId
  async assignRealmRoleByUserId(userId: string, roleName: string) {
    const token = await this.getAdminToken();
    const role = await this.getRoleByName(roleName, token);
    const url = `${this.base}/admin/realms/${this.realm}/users/${userId}/role-mappings/realm`;
    await this.postJson(url, token, [{ id: role.id, name: role.name }]);
  }
}
