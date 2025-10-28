import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { UsuariosApi, UsuarioDto } from '../api/usuarios.api';

@Injectable({ providedIn: 'root' })
export class UserSessionService {
  private api = inject(UsuariosApi);
  private _me$ = new BehaviorSubject<UsuarioDto | null>(null);

  //Observable del perfil
  me$ = this._me$.asObservable();

  //Cargar/Refrescar desde la API
  async load(): Promise<void> {
    try {
      const me = await firstValueFrom(this.api.me());
      this._me$.next(me);
    } catch (e) {
      console.warn('[UserSession] No se pudo cargar /usuarios/me', e);
      this._me$.next(null);
    }
  }

  //Último valor cacheado
  get me(): UsuarioDto | null {
    return this._me$.value;
  }

  //Helpers por rol según idRolUsuario
  isAdmin(): boolean {
    return this.me?.idRolUsuario === 1;
  }
  isOperario(): boolean {
    return this.me?.idRolUsuario === 2;
  }
  isCliente(): boolean {
    return this.me?.idRolUsuario === 3;
  }
}
