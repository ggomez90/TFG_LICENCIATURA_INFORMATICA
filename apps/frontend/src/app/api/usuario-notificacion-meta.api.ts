import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface EstadoNotificacionUsuario {
  idUsuario: number;
  ultimaNotificacionVistaAt: string | null;
  hayNovedades: boolean;
  cantidadNuevas: number;
}

export interface MarcarVistaResponse {
  ok: boolean;
  idUsuario: number;
  ultimaNotificacionVistaAt: string;
}

@Injectable({ providedIn: 'root' })
export class UsuarioNotificacionMetaApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/usuario-notificacion-meta';

  getEstado(): Observable<EstadoNotificacionUsuario> {
    return this.http.get<EstadoNotificacionUsuario>(`${this.baseUrl}/estado`);
  }

  marcarVista(): Observable<MarcarVistaResponse> {
    return this.http.patch<MarcarVistaResponse>(`${this.baseUrl}/marcar-vista`, {});
  }
}