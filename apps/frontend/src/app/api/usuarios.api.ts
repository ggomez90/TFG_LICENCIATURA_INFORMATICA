// apps/frontend/src/app/api/usuarios.api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from './api.config';

export interface UsuarioDto {
  idUsuario: number;
  usuario: string;
  email: string;
  nombres?: string | null;
  apellidos?: string | null;
  dniCuitCuil?: string | null;
  idRolUsuario: number;
  idEstadoUsuario: number;
}

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private http = inject(HttpClient);

  /** Crea/sincroniza el usuario local a partir del token actual. */
  syncMe(): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(apiUrl('/usuarios/me/sync'));
  }

  /** Traer mi perfil ya sincronizado. */
  me(): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(apiUrl('/usuarios/me'));
  }
}
