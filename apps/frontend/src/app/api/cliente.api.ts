// apps/frontend/src/app/api/cliente.api.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from './api.config';

export interface ClienteDto {
  idCliente: number;
  razonSocial: string | null;
  direccion: string;
  idProvincia: number;
  idLocalidad: number;
  idTipoCliente: number | null;
  puntos: number;
  idUsuario?: number | null;
}

export interface UpdateClienteDto {
  razonSocial?: string | null;
  direccion?: string | null;
  idProvincia?: number | null;
  idLocalidad?: number | null;
  idTipoCliente?: number | null;
}


@Injectable({ providedIn: 'root' })
export class ClienteApi {
  private http = inject(HttpClient);

  getById(id: number): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(apiUrl(`/clientes/${id}`));
  }

  me(): Observable<ClienteDto> {
    return this.http.get<ClienteDto>(apiUrl('/clientes/me'));
  }

  //editar cliente logueado
  updateMe(dto: UpdateClienteDto): Observable<ClienteDto> {
    return this.http.patch<ClienteDto>(apiUrl('/clientes/me'), dto);
  }
}
