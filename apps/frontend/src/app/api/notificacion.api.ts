import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificacionItem {
  idNotificacion: number;
  titulo: string;
  mensaje: string;
  fechaCreacion: string;
  visible: boolean;
  idRolUsuario: number;
}

export interface NotificacionListResponse {
  items: NotificacionItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface CrearNotificacionDto {
  idRolUsuario: number;
  titulo: string;
  mensaje: string;
  visible?: boolean;
}

export interface EditarNotificacionDto {
  idRolUsuario?: number;
  titulo?: string;
  mensaje?: string;
  visible?: boolean;
}

export interface UpdateVisibleNotificacionDto {
  visible: boolean;
}

export interface FilterNotificacionAdmin {
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  idAdmin?: number;
  idRolUsuario?: number;
  visible?: boolean;
  desde?: string;
  hasta?: string;
}

export interface FilterNotificacionPublic {
  limit?: number;
  offset?: number;
  desde?: string;
  hasta?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificacionApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/notificaciones';

  getMias(params?: FilterNotificacionPublic): Observable<NotificacionListResponse> {
    return this.http.get<NotificacionListResponse>(`${this.baseUrl}/mias`, {
      params: this.buildParams(params),
    });
  }

  getAll(params?: FilterNotificacionAdmin): Observable<any> {
    return this.http.get<any>(this.baseUrl, {
      params: this.buildParams(params),
    });
  }

  create(payload: CrearNotificacionDto): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  update(idNotificacion: number, payload: EditarNotificacionDto): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${idNotificacion}`, payload);
  }

  updateVisible(idNotificacion: number, payload: UpdateVisibleNotificacionDto): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${idNotificacion}/visible`, payload);
  }

  private buildParams(obj?: Record<string, any>): HttpParams {
    let params = new HttpParams();

    if (!obj) return params;

    Object.entries(obj).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}