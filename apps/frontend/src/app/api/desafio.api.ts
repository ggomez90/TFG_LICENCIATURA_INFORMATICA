import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface DesafioItem {
  idDesafio: number;
  titulo: string;
  descripcion: string;
  tipoResiduo: string;
  requiereInscripcion: boolean;
  unidadMedida: string;
  meta: number;
  puntosTotales: number;
  puntosPorUnidad?: number | null;
  bonificacionDesafioCompleto?: number | null;
  otorgaPuntosParcial: boolean;
  fechaInicio: string;      // ISO
  fechaFin?: string | null; // ISO acepta null
  estado: number;           // 1/2/3
  idRecursoEducativo?: number | null;
}

export interface DesafioListResponse {
  items: DesafioItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface DesafioSummaryResponse {
  total: number;
  activos: number;
  pausados: number;
  finalizados: number;
  inscripcionesTotales: number;
}

export interface DesafioListParams {
  limit?: number;
  offset?: number;
  sortBy?: 'idDesafio' | 'fechaInicio' | 'fechaFin' | 'estado' | 'titulo';
  order?: 'asc' | 'desc';
  estado?: 1 | 2 | 3;
  q?: string;
  fechaDesde?: string; // yyyy-MM-dd
  fechaHasta?: string; // yyyy-MM-dd
  requiereInscripcion?: 0 | 1;
  tipoResiduo?: string;
}

//DTO de creación que acepta fechas en YYYY-MM-DD y números opcionales como number|null
export interface DesafioCreateDto {
  idAdmin: number;

  titulo?: string;
  descripcion?: string;
  tipoResiduo: string;

  requiereInscripcion: boolean;
  unidadMedida: string;

  meta: number;                         // decimal
  puntosTotales: number;                // entero
  puntosPorUnidad?: number | null;      // decimal | null
  bonificacionDesafioCompleto?: number | null;

  otorgaPuntosParcial: boolean;

  fechaInicio: string;     // 'YYYY-MM-DD'
  fechaFin?: string;       // 'YYYY-MM-DD'

  estado: 1 | 2 | 3;

  idRecursoEducativo?: number;
}

export interface DesafioUpdateDto {
  // solo para campos editables
  titulo?: string;
  descripcion?: string;
  tipoResiduo?: string;
  requiereInscripcion?: boolean;
  unidadMedida?: string;

  // meta, puntosTotales y puntosPorUnidad NO se editan

  bonificacionDesafioCompleto?: number | null;
  otorgaPuntosParcial?: boolean;

  // fechaInicio NO editable
  fechaFin?: string;

  estado?: 1 | 2 | 3;

  idRecursoEducativo?: number;
}

@Injectable({ providedIn: 'root' })
export class DesafioApi {
  private base = '/api/desafios';

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DesafioSummaryResponse> {
    return this.http.get<DesafioSummaryResponse>(`${this.base}/admin/summary`);
  }

  listDesafios(params: DesafioListParams): Observable<DesafioListResponse> {
    let httpParams = new HttpParams();

    // NO enviamos sortBy ni order porque el back no los acepta, cuando lo hice trae error 400
    if (params.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset != null) httpParams = httpParams.set('offset', String(params.offset));
    if (params.estado != null) httpParams = httpParams.set('estado', String(params.estado));
    if (params.q) httpParams = httpParams.set('q', params.q);
    if (params.fechaDesde) httpParams = httpParams.set('fechaDesde', params.fechaDesde);
    if (params.fechaHasta) httpParams = httpParams.set('fechaHasta', params.fechaHasta);
    if (params.requiereInscripcion != null) {
      httpParams = httpParams.set('requiereInscripcion', String(params.requiereInscripcion));
    }
    if (params.tipoResiduo) httpParams = httpParams.set('tipoResiduo', params.tipoResiduo);

    return this.http.get<DesafioListResponse>(this.base, { params: httpParams }).pipe(
      map((res) => {
        // Normalización de numéricos que podrían venir como string
        const items = (res.items ?? []).map((i) => ({
          ...i,
          meta: typeof (i as any).meta === 'string' ? parseFloat((i as any).meta) : i.meta,
          puntosPorUnidad:
            (i as any).puntosPorUnidad == null
              ? null
              : (typeof (i as any).puntosPorUnidad === 'string'
                  ? parseFloat((i as any).puntosPorUnidad)
                  : (i as any).puntosPorUnidad),
        }));

        // Orden del lado del cliente SOLO si el caller lo pide
        let sorted = items;
        if (params.sortBy) {
          sorted = [...items].sort((a: any, b: any) => {
            const av = a[params.sortBy!];
            const bv = b[params.sortBy!];
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            if (typeof av === 'string' && typeof bv === 'string') {
              return av.localeCompare(bv);
            }
            return av > bv ? 1 : av < bv ? -1 : 0;
          });
          if (params.order === 'desc') sorted.reverse();
        }

        // Respetamos el limit si vino (para mostrar los ultimos 10 en dashboard)
        const limited = typeof params.limit === 'number' ? sorted.slice(0, params.limit) : sorted;

        return {
          ...res,
          items: limited,
        };
      })
    );
  }


  // Normaliza YYYY-MM-DD a ISO local DD/MM/YYYY
  private toIsoLocal(dateYmd: string | undefined): string | undefined {
    if (!dateYmd) return undefined;
    const d = new Date(`${dateYmd}T00:00:00`);
    return d.toISOString();
  }

  // POST /api/desafios 
  create(raw: DesafioCreateDto): Observable<void> {
    const payload: any = {
      ...raw,
      fechaInicio: this.toIsoLocal(raw.fechaInicio),
      fechaFin: this.toIsoLocal(raw.fechaFin),
    };
    // Limpieza de opcionales vacíos
    if (payload.titulo) payload.titulo = String(payload.titulo).trim() || undefined;
    if (payload.descripcion) payload.descripcion = String(payload.descripcion).trim() || undefined;
    if (payload.tipoResiduo) payload.tipoResiduo = String(payload.tipoResiduo).trim();
    if (payload.unidadMedida) payload.unidadMedida = String(payload.unidadMedida).trim();
    if (payload.idRecursoEducativo == null) delete payload.idRecursoEducativo;
    if (payload.puntosPorUnidad == null) delete payload.puntosPorUnidad;
    if (payload.bonificacionDesafioCompleto == null) delete payload.bonificacionDesafioCompleto;

    return this.http.post<void>(this.base, payload);
  }

  // GET /api/desafios/:id
  getById(id: number) {
    return this.http.get<DesafioItem>(`${this.base}/${id}`);
  }

  // PATCH /api/desafios/:id
  update(id: number, raw: DesafioUpdateDto): Observable<void> {
    const payload: any = { ...raw };

    // normalizaciones
    if (typeof payload.titulo === 'string') payload.titulo = payload.titulo.trim() || undefined;
    if (typeof payload.descripcion === 'string') payload.descripcion = payload.descripcion.trim() || undefined;
    if (typeof payload.tipoResiduo === 'string') payload.tipoResiduo = payload.tipoResiduo.trim();
    if (typeof payload.unidadMedida === 'string') payload.unidadMedida = payload.unidadMedida.trim();

    // idRecursoEducativo si viene null/undefined, no lo mandamos
    if (payload.idRecursoEducativo == null) delete payload.idRecursoEducativo;

    // bonificación: permitir null o number; si es undefined, no enviar
    if (payload.bonificacionDesafioCompleto === undefined) {
      delete payload.bonificacionDesafioCompleto;
    }

    // fechaFin YYYY-MM-DD a ISO local
    if (payload.fechaFin) {
      const d = new Date(`${payload.fechaFin}T00:00:00`);
      payload.fechaFin = d.toISOString();
    }

    return this.http.patch<void>(`${this.base}/${id}`, payload);
  }
}
