import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type TipoMovimientoCode = 1 | 2; // 1 CREDITO, 2 DEBITO
export type OrigenMovimientoCode = 1 | 2 | 3; // 1 ENTREGA, 2 VOUCHER, 3 AJUSTE

export interface MovimientoPuntosItem {
  idMovimiento: number;
  idCliente: number;
  fecha: string;
  tipo: TipoMovimientoCode;
  origen: OrigenMovimientoCode;
  puntos: number;
  descripcion?: string | null;
  idEntrega?: number | null;
  idVoucher?: number | null;
  idAdmin?: number | null;
}

export interface PagedMovimientoPuntos {
  items: MovimientoPuntosItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface FilterMovimientoPuntos {
  limit?: number;
  offset?: number;
  sortBy?: 'fecha' | 'puntos' | 'idMovimiento';
  order?: 'asc' | 'desc';
  idTipoMovimiento?: number;
  idOrigenMovimiento?: number;
  idEntrega?: number;
  idVoucher?: number;
  idAdmin?: number;
  desde?: string;
  hasta?: string;
}

@Injectable({ providedIn: 'root' })
export class MovimientosApi {
  private http = inject(HttpClient);
  private readonly base = '/api/movimientos';

  list(filter: FilterMovimientoPuntos = {}): Observable<PagedMovimientoPuntos> {
    let params = new HttpParams();

    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });

    return this.http.get<PagedMovimientoPuntos>(this.base, { params });
  }
}