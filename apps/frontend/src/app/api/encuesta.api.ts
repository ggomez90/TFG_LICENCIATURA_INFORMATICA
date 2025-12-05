import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from './api.config';

export interface EncuestaItem {
  idEncuesta: number;
  titulo: string | null;
  descripcion?: string | null;
  fechaPublicacion: string;      // ISO
  fechaCierre?: string | null;   // ISO y null
  activa: boolean;
  idAdmin: number;
}

export interface EncuestaListResponse {
  items: EncuestaItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface EncuestaListParams {
  q?: string;
  activa?: boolean;
  fechaDesde?: string;           // yyyy-MM-dd
  fechaHasta?: string;           // yyyy-MM-dd

  // paginación flexible
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;

  sortBy?: 'idEncuesta' | 'titulo' | 'fechaPublicacion' | 'activa';
  order?: 'asc' | 'desc';
}

export interface CreateEncuestaDto {
  titulo?: string | null;
  descripcion?: string | null;
  activa?: boolean;
  idAdmin?: number;
}

export interface UpdateEncuestaDto extends CreateEncuestaDto {}

export interface UpdateActivaEncuestaDto {
  activa: boolean;
}

@Injectable({ providedIn: 'root' })
export class EncuestaApi {
  private http = inject(HttpClient);

  // Listado para admin o publico
  list(params: EncuestaListParams = {}): Observable<EncuestaListResponse | EncuestaItem[]> {
    let httpParams = new HttpParams();
    const set = (k: string, v: any) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    };

    set('limit', params.limit);
    set('offset', params.offset);
    set('page', params.page);
    set('pageSize', params.pageSize);

    set('q', params.q);
    if (typeof params.activa === 'boolean') set('activa', String(params.activa)); // "true"/"false"
    set('fechaDesde', params.fechaDesde);
    set('fechaHasta', params.fechaHasta);
    set('sortBy', params.sortBy);
    set('order', params.order);

    return this.http.get<EncuestaListResponse | EncuestaItem[]>(apiUrl('/encuestas'), { params: httpParams });
  }

  // Get público
  getPublicById(id: number): Observable<EncuestaItem> {
    return this.http.get<EncuestaItem>(apiUrl(`/encuestas/${id}`));
  }

  // Get admin
  getAdminById(id: number): Observable<EncuestaItem> {
    return this.http.get<EncuestaItem>(apiUrl(`/encuestas/admin/${id}`));
  }

  create(dto: CreateEncuestaDto): Observable<EncuestaItem> {
    return this.http.post<EncuestaItem>(apiUrl('/encuestas'), dto);
  }

  update(id: number, dto: UpdateEncuestaDto): Observable<EncuestaItem> {
    return this.http.patch<EncuestaItem>(apiUrl(`/encuestas/${id}`), dto);
  }

  // Cambiar activa, /api/encuestas/:id/activa
  updateActiva(id: number, dto: UpdateActivaEncuestaDto): Observable<EncuestaItem> {
    return this.http.patch<EncuestaItem>(apiUrl(`/encuestas/${id}/activa`), dto);
  }
}
