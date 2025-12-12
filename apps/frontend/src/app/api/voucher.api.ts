import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ===== Tipos base (podés ajustar cuando cierres el contrato del back) =====
export type EstadoVoucherCode = 1 | 2 | 3 | 4; // 1 CREADO, 2 ADQUIRIDO, 3 UTILIZADO, 4 ANULADO

export interface VoucherListItem {
  idVoucher: number;
  idCliente: number;
  idVoucherTipo: number;
  estadoVoucher: EstadoVoucherCode;
  fechaAdquisicion: string;   // ISO
  fechaUso?: string | null;   // ISO o null
  // opcional si el back incluye la relación
  voucherTipo?: {
    idVoucherTipo: number;
    titulo: string;
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
  q?: string;                 // si luego agregás búsqueda textual
}

// para crear desde admin (ej.: emitir a un cliente)
export interface CreateVoucherPayload {
  idCliente: number;
  idVoucherTipo: number;
  // opcionales según negocio:
  estadoVoucher?: EstadoVoucherCode; // si el back lo setea por defecto, podés omitir
  fechaAdquisicion?: string;         // ISO (si el back default now(), omitir)
}

// para editar datos libres del voucher (si aplica)
export interface UpdateVoucherPayload {
  idCliente?: number;
  idVoucherTipo?: number;
  fechaUso?: string | null;          // setear uso o revertir a null
  // otros campos que habilite el back
}

// para cambio de estado (utilizar/anular/etc.)
export interface UpdateEstadoVoucherPayload {
  estadoVoucher: EstadoVoucherCode;  // 2=ADQUIRIDO, 3=UTILIZADO, 4=ANULADO
  // opcional: metadatos, motivo de anulación, etc.
  motivo?: string;
  fechaUso?: string;                 // útil cuando pasás a UTILIZADO
}

@Injectable({ providedIn: 'root' })
export class VoucherApi {
  private http = inject(HttpClient);
  private readonly base = '/api/vouchers';

  // LIST (admin): trae { items, total, ... }
  list(filter: FilterVoucher = {}): Observable<PagedVoucher> {
    let params = new HttpParams();
    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<PagedVoucher>(this.base, { params });
  }

  // GET by id
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

  // Cambiar estado (utilizar / anular / etc.)
  // Sugerido en back: PATCH /api/vouchers/:id/estado { estadoVoucher, ... }
  updateEstado(idVoucher: number, payload: UpdateEstadoVoucherPayload): Observable<{ idVoucher: number; estadoVoucher: EstadoVoucherCode }> {
    return this.http.patch<{ idVoucher: number; estadoVoucher: EstadoVoucherCode }>(
      `${this.base}/${idVoucher}/estado`,
      payload
    );
  }

  existsForTipo(idVoucherTipo: number): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.base}/existe-tipo/${idVoucherTipo}`);
  }
}
