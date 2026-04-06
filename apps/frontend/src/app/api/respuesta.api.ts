import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from './api.config';

export interface RespuestaItem {
  idRespuesta: number;
  idEncuesta: number;
  idUsuario?: number | null;
  datosInvitado?: string | null;
  dniCuilCuitInvitado?: string | null;
  fechaRespuesta: string;
  contenido: string;
}

export interface RespuestaListResponse {
  items: RespuestaItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface CreateRespuestaDto {
  idEncuesta: number;
  fechaRespuesta?: string;
  contenido: string;
  datosInvitado?: string;
  dniCuilCuitInvitado?: string;
}

@Injectable({ providedIn: 'root' })
export class RespuestaApi {
  private http = inject(HttpClient);

  // LOGUEADO: ya respondí esta encuesta?
  getMine(idEncuesta: number): Observable<RespuestaItem | null> {
    const params = new HttpParams().set('idEncuesta', String(idEncuesta));
    return this.http.get<RespuestaItem | null>(apiUrl('/respuestas/mine'), { params });
  }

  // LOGUEADO: listado general
  list(params: { idEncuesta: number; limit?: number }): Observable<RespuestaListResponse> {
    let p = new HttpParams().set('idEncuesta', String(params.idEncuesta));
    if (params.limit) p = p.set('limit', String(params.limit));
    return this.http.get<RespuestaListResponse>(apiUrl('/respuestas'), { params: p });
  }

  // LOGUEADO
  createMine(dto: CreateRespuestaDto): Observable<RespuestaItem> {
    return this.http.post<RespuestaItem>(apiUrl('/respuestas'), dto);
  }

  // INVITADO
  createPublic(dto: CreateRespuestaDto): Observable<RespuestaItem> {
    return this.http.post<RespuestaItem>(apiUrl('/respuestas/public'), dto);
  }

  // INVITADO: chequear por DNI
  checkPublic(idEncuesta: number, dni: string): Observable<{ responded: boolean; item: RespuestaItem | null }> {
    const params = new HttpParams()
      .set('idEncuesta', String(idEncuesta))
      .set('dni', dni);

    return this.http.get<{ responded: boolean; item: RespuestaItem | null }>(
      apiUrl('/respuestas/public/check'),
      { params },
    );
  }
}