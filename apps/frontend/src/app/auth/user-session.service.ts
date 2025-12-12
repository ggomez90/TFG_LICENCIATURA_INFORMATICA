import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { UsuariosApi, UsuarioDto } from '../api/usuarios.api';
import { keycloak } from './keycloak';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private api = inject(UsuariosApi);
  private _me$ = new BehaviorSubject<UsuarioDto | null>(null);

  // Observable del perfil
  me$ = this._me$.asObservable();

  constructor() {
    // 1) Si ya está autenticado al iniciar la app, cargamos perfil
    if (keycloak.authenticated) {
      this.safeLoad();
    }

    // 2) Cuando Keycloak notifique éxito de auth, recargamos perfil
    (keycloak as any).onAuthSuccess = () => {
      // console.debug('[UserSession] onAuthSuccess → load /usuarios/me');
      this.safeLoad();
    };

    // 3) Mantener el token fresco
    (keycloak as any).onTokenExpired = async () => {
      try {
        await keycloak.updateToken(30);
      } catch {
        // Si no se puede refrescar, forzamos login
        keycloak.login({ redirectUri: window.location.href });
      }
    };
  }

  // Cargar/Refrescar desde la API
  async load(): Promise<void> {
    const me = await firstValueFrom(this.api.me());
    this._me$.next(me);
  }

  // Igual que load(), pero con try/catch y sin romper el flujo
  private async safeLoad(): Promise<void> {
    try {
      await this.load();
    } catch (e) {
      console.warn('[UserSession] No se pudo cargar /usuarios/me', e);
      this._me$.next(null);
    }
  }

  // Último valor cacheado
  get me(): UsuarioDto | null {
    return this._me$.value;
  }

  // Helpers por rol según idRolUsuario
  isAdmin(): boolean { return this.me?.idRolUsuario === 1; }
  isOperario(): boolean { return this.me?.idRolUsuario === 2; }
  isCliente(): boolean { return this.me?.idRolUsuario === 3; }

  // === NUEVO: ID de usuario actual (o null si no hay sesión) ===
  getIdUsuario(): number | null {
    return this.me?.idUsuario ?? null;
  }
}
