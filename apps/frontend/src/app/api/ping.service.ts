import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class PingService {
  private http = inject(HttpClient);

  // Pasa por Nginx (http://localhost) usando rutas relativas
  pingSecure() {
    return this.http.get<{ ok: boolean; secure: boolean }>('/api/secure/ping');
  }

  cliente() {
    return this.http.get<{ ok: boolean; role: string }>('/api/secure/cliente');
  }

  operario() {
    return this.http.get<{ ok: boolean; role: string }>('/api/secure/operario');
  }

  admin() {
    return this.http.get<{ ok: boolean; role: string }>('/api/secure/admin');
  }
}
