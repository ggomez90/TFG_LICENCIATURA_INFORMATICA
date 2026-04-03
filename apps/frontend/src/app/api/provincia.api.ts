import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from './api.config';

export interface ProvinciaDto {
  idProvincia: number;
  nombre: string;
}

@Injectable({ providedIn: 'root' })
export class ProvinciaApi {
  private http = inject(HttpClient);

  getById(id: number): Observable<ProvinciaDto> {
    return this.http.get<ProvinciaDto>(apiUrl(`/provincia/${id}`));
  }

  getAll(params?: {
    page?: number;
    pageSize?: number;
    q?: string;
    order?: 'ASC' | 'DESC';
    sortBy?: 'nombre' | 'idProvincia';
  }) {
    const safe: any = {};

    if (params?.page !== undefined && params?.page !== null) safe.page = String(Number(params.page));
    if (params?.pageSize !== undefined && params?.pageSize !== null) safe.pageSize = String(Number(params.pageSize));

    if (params?.q !== undefined && params?.q !== null && String(params.q).trim() !== '') safe.q = String(params.q);

    // Igual que en otros módulos: si tu controller está con whitelist estricto y te rompe
    // por order/sortBy, simplemente NO los mandes desde el componente.
    if (params?.order) safe.order = params.order;
    if (params?.sortBy) safe.sortBy = params.sortBy;

    return this.http.get<any>(apiUrl('/provincia'), { params: safe });
  }
}
