import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface InscripcionDesafioItem {
  idInscripcionDesafio: number;
  idCliente: number;
  idDesafio: number;
  fechaAdhesion: string;
  fechaBaja?: string | null;
  progreso: number | string;
  puntosAcumulados: number;
  estado: number;
}

export interface InscripcionListResponse {
  items: InscripcionDesafioItem[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface InscripcionListParams {
  limit?: number;
  offset?: number;
  idInscripcionDesafio?: number;
  idCliente?: number;
  idDesafio?: number;
  idEstadoDesafio?: number;
}

export interface CreateInscripcionDesafioDto {
  idCliente?: number;
  idDesafio: number;
  fechaAdhesion: string;
  fechaBaja?: string;
  progreso: string;
  puntosAcumulados: number;
  estado: number;
}

@Injectable({ providedIn: 'root' })
export class InscripcionApi {
  private readonly base = '/api/inscripciones';

  constructor(private readonly http: HttpClient) {}

  list(params: InscripcionListParams = {}): Observable<InscripcionListResponse> {
    let httpParams = new HttpParams();

    if (params.limit != null) httpParams = httpParams.set('limit', String(params.limit));
    if (params.offset != null) httpParams = httpParams.set('offset', String(params.offset));
    if (params.idInscripcionDesafio != null) {
      httpParams = httpParams.set('idInscripcionDesafio', String(params.idInscripcionDesafio));
    }
    if (params.idCliente != null) httpParams = httpParams.set('idCliente', String(params.idCliente));
    if (params.idDesafio != null) httpParams = httpParams.set('idDesafio', String(params.idDesafio));
    if (params.idEstadoDesafio != null) {
      httpParams = httpParams.set('idEstadoDesafio', String(params.idEstadoDesafio));
    }

    return this.http.get<InscripcionListResponse>(this.base, { params: httpParams }).pipe(
      map((res) => ({
        ...res,
        items: (res.items ?? []).map((i) => ({
          ...i,
          progreso:
            typeof i.progreso === 'string'
              ? parseFloat(i.progreso)
              : Number(i.progreso ?? 0),
        })),
      }))
    );
  }

  create(dto: CreateInscripcionDesafioDto): Observable<any> {
    return this.http.post(this.base, dto);
  }
}