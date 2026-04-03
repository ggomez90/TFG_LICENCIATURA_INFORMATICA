import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// Estados
export type EstadoVoucherCode = 1 | 2 | 3 | 4; // 1 CREADO, 2 ADQUIRIDO, 3 UTILIZADO, 4 ANULADO

export interface VoucherListItem {
  idVoucher: number;
  idCliente: number;
  idVoucherTipo: number;
  estadoVoucher: EstadoVoucherCode;
  fechaAdquisicion: string;   // ISO
  fechaUso?: string | null;   // ISO o null
  //relacion entre voucher y voucher tipo
  voucherTipo?: {
    idVoucherTipo: number;
    titulo: string;
    puntosRequeridos?: number;
    montoBeneficio?: number;
  };
}

export interface PagedVoucher {
  items: VoucherListItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface FilterVoucher {
  limit?: number;
  offset?: number;
  sortBy?: 'idVoucher' | 'fechaAdquisicion' | 'fechaUso';
  order?: 'asc' | 'desc';
  idCliente?: number;         // para filtrar por cliente
  idVoucherTipo?: number;     // para filtrar por tipo
  estadoVoucher?: EstadoVoucherCode;
  desde?: string;             // ISO yyyy-MM-dd (fechaAdquisicion >=)
  hasta?: string;             // ISO yyyy-MM-dd (fechaAdquisicion <=)
  q?: string;                 // busqueda por texto
}

// para crear desde admin
export interface CreateVoucherPayload {
  idCliente: number;
  idVoucherTipo: number;
  // opcionales
  estadoVoucher?: EstadoVoucherCode; // el back setea por defecto ADQUIRIDO
  fechaAdquisicion?: string;         // por defecto now()
}

// para editar datos libres del voucher
export interface UpdateVoucherPayload {
  idCliente?: number;
  idVoucherTipo?: number;
  fechaUso?: string | null;          // setear uso o revertir a null
}

// para cambio de estado
export interface UpdateEstadoVoucherPayload {
  estadoVoucher: EstadoVoucherCode;  // 3=UTILIZADO, 4=ANULADO
  // motivo del cambio
  motivo?: string;
  fechaUso?: string;
}

export interface AdquirirVoucherClientePayload {
  idVoucherTipo: number;
}

export interface AdquirirVoucherClienteResponse {
  message: string;
  voucher: VoucherListItem;
  puntosDebitados: number;
  puntosDisponibles: number;
}

export interface AnularVoucherClienteResponse {
  message: string;
  voucher: VoucherListItem;
  puntosReintegrados: number;
  puntosDisponibles: number;
}

@Injectable({ providedIn: 'root' })
export class VoucherApi {
  private http = inject(HttpClient);
  private readonly base = '/api/vouchers';

  // listado
  list(filter: FilterVoucher = {}): Observable<PagedVoucher> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PagedVoucher>(this.base, { params });
  }

  //obtener por id
  getById(idVoucher: number): Observable<VoucherListItem> {
    return this.http.get<VoucherListItem>(`${this.base}/${idVoucher}`);
  }

  // CREATE (admin emite a un cliente)
  create(payload: CreateVoucherPayload): Observable<VoucherListItem> {
    return this.http.post<VoucherListItem>(this.base, payload);
  }

  // UPDATE (datos editables del voucher)
  update(idVoucher: number, payload: UpdateVoucherPayload): Observable<VoucherListItem> {
    return this.http.patch<VoucherListItem>(`${this.base}/${idVoucher}`, payload);
  }

  // Cambiar estado
  updateEstado(idVoucher: number, payload: UpdateEstadoVoucherPayload): Observable<{ idVoucher: number; estadoVoucher: EstadoVoucherCode }> {
    return this.http.patch<{ idVoucher: number; estadoVoucher: EstadoVoucherCode }>(
      `${this.base}/${idVoucher}/estado`,
      payload
    );
  }

  existsForTipo(idVoucherTipo: number): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.base}/existe-tipo/${idVoucherTipo}`);
  }

  adquirirCliente(payload: AdquirirVoucherClientePayload): Observable<AdquirirVoucherClienteResponse> {
    return this.http.post<AdquirirVoucherClienteResponse>(`${this.base}/cliente/adquirir`, payload);
  }

  anularCliente(idVoucher: number): Observable<AnularVoucherClienteResponse> {
    return this.http.post<AnularVoucherClienteResponse>(`${this.base}/${idVoucher}/cliente/anular`, {});
  }
}
