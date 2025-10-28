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

//DTO para alta por administrador alineado con el del back
export interface AdminCreateUsuarioDto {
  nombres: string;
  apellidos: string;
  usuario: string;
  email: string;
  dniCuitCuil?: string | null;
  idRolUsuario: 1 | 2 | 3; //1=ADMIN, 2=OPERARIO, 3=CLIENTE
}

//Respuesta del backend al crear por admin
export interface AdminCreateUsuarioResp {
  kcUserId?: string;
  message?: string;
  usuario?: UsuarioDto;
}

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private http = inject(HttpClient);

  //Sincroniza el usuario autenticado actual (Keycloak y BD)
  syncMe(): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(apiUrl('/usuarios/me/sync'));
  }

  //Devuelve el perfil del usuario autenticado
  me(): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(apiUrl('/usuarios/me'));
  }

  //Crea un usuario desde el panel administrador
  createByAdmin(dto: AdminCreateUsuarioDto): Observable<AdminCreateUsuarioResp> {
    return this.http.post<AdminCreateUsuarioResp>(apiUrl('/usuarios/admin'), dto);
  }
}
