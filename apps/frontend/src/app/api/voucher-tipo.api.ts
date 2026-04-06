import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AdminVoucherTipoItem {
  idVoucherTipo: number;
  idAdmin: number;
  titulo: string;
  descripcion: string;
  puntosRequeridos: number;
  montoBeneficio: number;
  fechaInicioVigencia: string; // ISO
  fechaFinVigencia: string;    // ISO
  activa: boolean;
}

export interface PagedVoucherTipo {
  items: AdminVoucherTipoItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface FilterVoucherTipo {
  limit?: number;
  offset?: number;
  sortBy?: 'idVoucherTipo' | 'fechaInicioVigencia' | 'fechaFinVigencia' | 'puntosRequeridos';
  order?: 'asc' | 'desc';
  idAdmin?: number;
  activa?: boolean;
  desde?: string; // yyyy-MM-dd
  hasta?: string; // yyyy-MM-dd
}

export interface ClienteVoucherTipoItem extends AdminVoucherTipoItem {
  puntosDisponibles: number;
  disponibleParaCanje: boolean;
  puntosFaltantes: number;
}

export interface PagedVoucherTipoCliente {
  items: ClienteVoucherTipoItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  puntosDisponibles: number;
}

export interface FilterVoucherTipoCliente {
  limit?: number;
  offset?: number;
  sortBy?: 'idVoucherTipo' | 'fechaInicioVigencia' | 'fechaFinVigencia' | 'puntosRequeridos' | 'montoBeneficio';
  order?: 'asc' | 'desc';
  soloCanjeables?: boolean;
}

@Injectable({ providedIn: 'root' })
export class VoucherTipoApi {
  private http = inject(HttpClient);
  private readonly base = '/api/voucher-tipo';

  getAll(filter: FilterVoucherTipo): Observable<PagedVoucherTipo> {
    let params = new HttpParams();
    Object.entries(filter ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PagedVoucherTipo>(this.base, { params });
  }

  create(payload: Partial<AdminVoucherTipoItem>) {
    return this.http.post<AdminVoucherTipoItem>(this.base, payload);
  }

  update(idVoucherTipo: number, payload: Partial<AdminVoucherTipoItem>) {
    return this.http.patch<AdminVoucherTipoItem>(`${this.base}/${idVoucherTipo}`, payload);
  }

  updateActiva(idVoucherTipo: number, activa: boolean) {
    return this.http.patch<{ idVoucherTipo: number; activa: boolean }>(`${this.base}/${idVoucherTipo}/activa`, { activa });
  }

  getById(id: number) {
    return this.http.get<AdminVoucherTipoItem>(`${this.base}/${id}`);
  }

  getDisponiblesCliente(filter: FilterVoucherTipoCliente = {}): Observable<PagedVoucherTipoCliente> {
    let params = new HttpParams();
    Object.entries(filter ?? {}).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });
    return this.http.get<PagedVoucherTipoCliente>(`${this.base}/cliente/disponibles`, { params });
  }

  getDisponibleClienteById(idVoucherTipo: number): Observable<ClienteVoucherTipoItem> {
    return this.http.get<ClienteVoucherTipoItem>(`${this.base}/cliente/disponibles/${idVoucherTipo}`);
  }
}
