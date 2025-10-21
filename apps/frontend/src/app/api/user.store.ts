import { Injectable, signal } from '@angular/core';
import { UsuariosApi, UsuarioDto } from './usuarios.api';
import { tap } from 'rxjs/operators';
import { keycloak } from '../auth/keycloak';

@Injectable({ providedIn: 'root' })
export class UserStore {
  me = signal<UsuarioDto | null>(null);

  constructor(private api: UsuariosApi) {}

  load() {
    if (!keycloak.authenticated) return;
    this.api.me().pipe(tap(u => this.me.set(u))).subscribe({
      error: () => this.me.set(null),
    });
  }
}
