import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from './api.config';

export interface ContenidoItem {
  idContenidoEducativo: number;
  titulo: string | null;
  descripcion?: string | null;
  urlRecurso?: string | null;
  fechaPublicacion: string;   // ISO
  fechaBaja?: string | null;  // ISO acepta null
  visible: boolean;
  idAdmin: number;
}

export interface ContenidoListResponse {
  items: ContenidoItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface ContenidoListAdminParams {
  q?: string;
  visible?: number;               // acepta 0 o 1
  fechaDesde?: string;            // yyyy-MM-dd
  fechaHasta?: string;            // yyyy-MM-dd
  // paginación
  page?: number;
  pageSize?: number;
  limit?: number;
  offset?: number;

  sortBy?: 'idContenidoEducativo' | 'titulo' | 'fechaPublicacion' | 'visible';
  order?: 'asc' | 'desc';
}

export interface ContenidoPublicListItem {
  idContenidoEducativo: number;
  titulo: string | null;
  fechaPublicacion: string; // ISO
  visible: boolean;
}

export interface CreateContenidoDto {
  titulo?: string | null;
  descripcion?: string | null;
  urlRecurso?: string | null;
  visible?: boolean;
  idAdmin?: number;
}

export interface UpdateContenidoDto extends CreateContenidoDto {}

export interface UpdateVisibleContenidoDto {
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ContenidoApi {
  private http = inject(HttpClient);

  // lista publica, solo visibles
  listPublic(): Observable<ContenidoPublicListItem[]> {
    return this.http.get<ContenidoPublicListItem[]>(apiUrl('/contenidos'));
  }

  // listado para admin con filtros, incluye todos
  listAdmin(params: ContenidoListAdminParams = {}): Observable<ContenidoListResponse> {
    let httpParams = new HttpParams();
    const set = (k: string, v: any) => {
      if (v !== undefined && v !== null && v !== '') httpParams = httpParams.set(k, String(v));
    };

    set('limit', params.limit);
    set('offset', params.offset);
    set('page', params.page);
    set('pageSize', params.pageSize);

    set('q', params.q);
    set('visible', params.visible);
    set('fechaDesde', params.fechaDesde);
    set('fechaHasta', params.fechaHasta);
    set('sortBy', params.sortBy);
    set('order', params.order);

    return this.http.get<ContenidoListResponse>(apiUrl('/contenidos/admin'), { params: httpParams });
  }

  // get para contenido por id, solo si esta visible
  getPublicById(id: number): Observable<ContenidoItem> {
    return this.http.get<ContenidoItem>(apiUrl(`/contenidos/${id}`));
  }

  // get para contenido por id para admin, incluye ver contenido oculto
  getAdminById(id: number): Observable<ContenidoItem> {
    return this.http.get<ContenidoItem>(apiUrl(`/contenidos/admin/${id}`));
  }

  // Crear
  create(dto: CreateContenidoDto): Observable<ContenidoItem> {
    return this.http.post<ContenidoItem>(apiUrl('/contenidos'), dto);
  }

  // Actualizar
  update(id: number, dto: UpdateContenidoDto): Observable<ContenidoItem> {
    return this.http.patch<ContenidoItem>(apiUrl(`/contenidos/${id}`), dto);
  }

  // Cambiar visibilidad
  updateVisible(id: number, dto: UpdateVisibleContenidoDto): Observable<ContenidoItem> {
    return this.http.patch<ContenidoItem>(apiUrl(`/contenidos/${id}/visible`), dto);
  }
}
