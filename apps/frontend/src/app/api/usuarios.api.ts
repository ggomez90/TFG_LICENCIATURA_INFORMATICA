import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { apiUrl } from './api.config';

export interface UpdateUsuarioDto {
  nombres?: string | null;
  apellidos?: string | null;
  dniCuitCuil?: string | null;
  idRolUsuario?: 1 | 2 | 3;
  idEstadoUsuario?: 1 | 2 | 3;
}

export interface HabilitarUsuarioDto {
  idEstadoUsuario?: 1 | 2 | 3;
  observacion?: string;
}

export interface BanearUsuarioDto { motivo: string; }

export type Order = 'asc' | 'desc';

export interface AdminUsuarioQuery {
  q?: string;
  email?: string;
  idRolUsuario?: 1 | 2 | 3;        // 1=ADMIN, 2=OPERARIO, 3=CLIENTE
  idEstadoUsuario?: 1 | 2 | 3;     // 1=PENDIENTE, 2=HABILITADO, 3=BANEADO

  // Paginación
  page?: number;                   // default: 1
  pageSize?: number;               // default: 50

  // Ordenamiento
  sortBy?: 'idUsuario' | 'usuario' | 'email' | 'idRolUsuario' | 'idEstadoUsuario';
  order?: Order;                   // 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  items: T[]; total: number; limit: number; offset: number;
  sortBy?: string; order?: Order;
}
function isPaginated<T>(x: any): x is PaginatedResponse<T> {
  return x && Array.isArray(x.items) && typeof x.total === 'number';
}

export interface UsuarioDto {
  idUsuario: number;
  usuario: string;
  email: string;
  nombres?: string | null;
  apellidos?: string | null;
  dniCuitCuil?: string | null;
  idRolUsuario: number;
  idEstadoUsuario: number;
  motivoBan?: string | null;

  //para /clientes/admin
  cliente?: {
    idCliente: number;
    idTipoCliente: number | null;
    razonSocial?: string | null;
    direccion?: string | null;
    idProvincia?: number | null;
    idLocalidad?: number | null;
    puntos?: number;
  } | null;
}

export interface AdminCreateUsuarioDto {
  nombres: string;
  apellidos: string;
  usuario: string;
  email: string;
  dniCuitCuil?: string | null;
  idRolUsuario: 1 | 2 | 3;
}

export interface AdminCreateUsuarioResp {
  kcUserId?: string;
  message?: string;
  usuario?: UsuarioDto;
}

@Injectable({ providedIn: 'root' })
export class UsuariosApi {
  private http = inject(HttpClient);

  syncMe(): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(apiUrl('/usuarios/me/sync'));
  }
  me(): Observable<UsuarioDto> {
    return this.http.get<UsuarioDto>(apiUrl('/usuarios/me'));
  }
  createByAdmin(dto: AdminCreateUsuarioDto) {
    return this.http.post<AdminCreateUsuarioResp>(apiUrl('/usuarios/admin'), dto);
  }

  //Consulta admin, si tipo=cliente y hay tipoCliente distinto de todos llamar a /clientes/admin
  //En caso contrario /usuarios
  queryAdmin(
    q: AdminUsuarioQuery & {
      tipo?: 'cliente' | 'operario' | 'admin';
      tipoCliente?: 'todos' | 'pendiente' | number; // acepta number directo (1|2|3)
    }
  ) {
    // ver si el filtro de cliente con subtipo activo
    const isClienteSub =
      q.tipo === 'cliente' &&
      q.tipoCliente !== undefined &&
      q.tipoCliente !== null &&
      q.tipoCliente !== 'todos';

    if (isClienteSub) {
      // Para /clientes/admin  manda: page, pageSize, tipoCliente
      let params = new HttpParams()
        .set('page', String(q.page ?? 1))
        .set('pageSize', String(q.pageSize ?? 50));

      if (q.tipoCliente === 'pendiente') {
        params = params.set('tipoCliente', 'pendiente');
      } else {
        // Forza número para 1/2/3
        params = params.set('tipoCliente', String(Number(q.tipoCliente)));
      }

      return this.http.get<PaginatedResponse<UsuarioDto> | (UsuarioDto & { cliente?: any })[]>(
        apiUrl('/clientes/admin'),
        { params }
      );
    }

    // RUTA USUARIOS
    // Para /usuarios manda page/pageSize y sortBy/order/tipo/q/estado
    let params = new HttpParams();

    const safeSet = (k: string, v: any) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    };

    safeSet('page', q.page ?? 1);
    safeSet('pageSize', q.pageSize ?? 50);
    safeSet('sortBy', q.sortBy ?? 'idUsuario');
    safeSet('order', q.order ?? 'desc');

    safeSet('tipo', q.tipo);               // 'cliente' | 'operario' | 'admin'
    safeSet('q', (q as any).q);
    safeSet('estado', (q as any).estado);

    return this.http.get<PaginatedResponse<UsuarioDto> | UsuarioDto[]>(
      apiUrl('/usuarios'),
      { params }
    );
  }

  fetchAllForCounters() {
    return this.http.get<UsuarioDto[]>(apiUrl('/usuarios')).pipe(
      catchError(() => of([]))
    );
  }

  updateByAdmin(id: number, dto: UpdateUsuarioDto) {
    return this.http.patch<UsuarioDto>(apiUrl(`/usuarios/${id}`), dto);
  }

  enable(id: number, dto: HabilitarUsuarioDto) {
    return this.http.patch<UsuarioDto>(apiUrl(`/usuarios/${id}/enable`), dto);
  }
  
  ban(id: number, dto: BanearUsuarioDto) {
    return this.http.patch<UsuarioDto>(apiUrl(`/usuarios/${id}/ban`), dto);
  }

  getById(id: number) {
    return this.http.get<UsuarioDto>(apiUrl(`/usuarios/${id}`));
  }

  //editar perfil logueado
  updateMe(dto: UpdateUsuarioDto): Observable<UsuarioDto> {
    return this.http.patch<UsuarioDto>(apiUrl('/usuarios/me'), dto);
  }
}
