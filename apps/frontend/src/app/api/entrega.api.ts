import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export type EstadoEntregaCode = 1 | 2 | 3 | 4 | 5 | 6;

export interface EntregaListItem {
  idEntrega: number;
  idCliente: number;
  idDesafio: number;
  idInscripcionDesafio: number;
  estado: EstadoEntregaCode;

  fechaCreacion: string;
  fechaVencimiento: string;
  fechaValidacion?: string | null;

  cantidadDeclarada: number;
  cantidadVerificada?: number | null;

  observaciones?: string | null;
  motivoRechazo?: string | null;
  ubicacion?: string | null;

  idOperarioValidador?: number | null;

  desafio?: {
    idDesafio: number;
    titulo?: string;
    unidadMedida?: string;
    tipoResiduo?: string;
    puntosPorUnidad?: number | string | null;
  } | null;
}

export interface PagedEntrega {
  items: EntregaListItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface FilterEntrega {
  limit?: number;
  offset?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';

  idCliente?: number;
  idDesafio?: number;
  estado?: EstadoEntregaCode;
  idInscripcionDesafio?: number;

  fechaDesde?: string;
  fechaHasta?: string;
}

export interface CreateEntregaDto {
  idCliente?: number;
  idDesafio: number;
  idInscripcionDesafio: number;
  fechaCreacion: string;
  fechaVencimiento: string;
  fechaValidacion?: string;
  cantidadDeclarada: number | string;
  cantidadVerificada?: number | string;
  estado: EstadoEntregaCode;
  observaciones?: string;
  idOperarioValidador?: number;
  motivoRechazo?: string;
  ubicacion?: string;
}

export interface UpdateEntregaDto {
  fechaCreacion?: string;
  fechaVencimiento?: string;
  fechaValidacion?: string;
  cantidadDeclarada?: number | string;
  cantidadVerificada?: number | string;
  observaciones?: string;
  idOperarioValidador?: number;
  motivoRechazo?: string;
  ubicacion?: string;
}

export interface UpdateEstadoEntregaDto {
  idEstadoEntrega: EstadoEntregaCode;
}

export interface RevisarEntregaOperarioDto {
  accion: 'VALIDAR' | 'RECHAZAR';
  cantidadVerificada?: number | string;
  observaciones?: string;
  motivoRechazo?: string;
}

export interface VolverPendienteEntregaDto {
  observaciones?: string;
}

export interface ConfirmarPuntosEntregaDto {
  observaciones?: string;
}

@Injectable({ providedIn: 'root' })
export class EntregasApi {
  private http = inject(HttpClient);
  private readonly base = '/api/entregas';

  list(filter: FilterEntrega = {}): Observable<PagedEntrega> {
    let params = new HttpParams();

    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });

    return this.http.get<PagedEntrega>(this.base, { params }).pipe(
      map((res) => ({
        ...res,
        items: (res.items ?? []).map((i: any) => ({
          ...i,
          cantidadDeclarada:
            typeof i?.cantidadDeclarada === 'string'
              ? parseFloat(i.cantidadDeclarada)
              : Number(i?.cantidadDeclarada ?? 0),
          cantidadVerificada:
            i?.cantidadVerificada == null
              ? null
              : typeof i.cantidadVerificada === 'string'
                ? parseFloat(i.cantidadVerificada)
                : Number(i.cantidadVerificada),
        })),
      }))
    );
  }

  create(dto: CreateEntregaDto): Observable<any> {
    return this.http.post(this.base, dto);
  }

  update(idEntrega: number, dto: UpdateEntregaDto): Observable<any> {
    return this.http.patch(`${this.base}/${idEntrega}`, dto);
  }

  updateEstado(idEntrega: number, dto: UpdateEstadoEntregaDto): Observable<any> {
    return this.http.patch(`${this.base}/${idEntrega}/estado`, dto);
  }

    revisarOperario(idEntrega: number, dto: RevisarEntregaOperarioDto): Observable<any> {
    return this.http.patch(`${this.base}/${idEntrega}/operario/revisar`, dto);
  }

  volverPendienteOperario(idEntrega: number, dto: VolverPendienteEntregaDto = {}): Observable<any> {
    return this.http.patch(`${this.base}/${idEntrega}/operario/volver-pendiente`, dto);
  }

  confirmarPuntosOperario(idEntrega: number, dto: ConfirmarPuntosEntregaDto = {}): Observable<any> {
    return this.http.patch(`${this.base}/${idEntrega}/operario/confirmar-puntos`, dto);
  }

  listDashboard(filter: FilterEntrega = {}): Observable<PagedEntrega> {
    let params = new HttpParams();

    Object.entries(filter).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });

    return this.http.get<PagedEntrega>(this.base, {
      params,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }).pipe(
      map((res) => ({
        ...res,
        items: (res.items ?? []).map((i: any) => ({
          ...i,
          cantidadDeclarada:
            typeof i?.cantidadDeclarada === 'string'
              ? parseFloat(i.cantidadDeclarada)
              : Number(i?.cantidadDeclarada ?? 0),
          cantidadVerificada:
            i?.cantidadVerificada == null
              ? null
              : typeof i.cantidadVerificada === 'string'
                ? parseFloat(i.cantidadVerificada)
                : Number(i.cantidadVerificada),
        })),
      }))
    );
  }
}