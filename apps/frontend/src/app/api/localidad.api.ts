import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from './api.config';

export interface LocalidadDto {
  idLocalidad: number;
  nombre: string;
  provincia?: { idProvincia: number; nombre: string };
}

@Injectable({ providedIn: 'root' })
export class LocalidadApi {
  private http = inject(HttpClient);

  getById(id: number): Observable<LocalidadDto> {
    return this.http.get<LocalidadDto>(apiUrl(`/localidad/${id}`));
  }

  getAll(params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    idProvincia?: number;
    order?: 'ASC' | 'DESC';
    sortBy?: 'idLocalidad' | 'nombre' | 'idProvincia';
  }) {
    // El back de Localidad usa page/pageSize y devuelve { data, meta }
    const safe: any = {};

    if (params?.page !== undefined && params?.page !== null) safe.page = String(Number(params.page));
    if (params?.pageSize !== undefined && params?.pageSize !== null) safe.pageSize = String(Number(params.pageSize));

    if (params?.q !== undefined && params?.q !== null && String(params.q).trim() !== '') safe.q = String(params.q);

    if (params?.idProvincia !== undefined && params?.idProvincia !== null) {
      const n = Number(params.idProvincia);
      if (Number.isFinite(n) && n > 0) safe.idProvincia = String(n);
    }

    if (params?.order) safe.order = params.order;
    if (params?.sortBy) safe.sortBy = params.sortBy;

    return this.http.get<any>(apiUrl('/localidad'), { params: safe });
  }
}
