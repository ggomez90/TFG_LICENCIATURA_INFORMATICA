import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RolesService } from '../../../auth/roles.service';

interface EncuestaRow {
  idEncuesta: number;
  titulo: string;
  fechaPublicacion: string; // ISO
  fechaCierre: string;      // ISO
  activa: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

@Component({
  selector: 'app-listar-encuesta',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './listar-encuesta.component.html',
  styleUrls: ['./listar-encuesta.component.scss'],
})

export class ListarEncuestaComponent implements OnInit {
  // estado
  items: EncuestaRow[] = [];
  loading = false;
  errorMsg = '';
  isAdmin = false;
  isCliente = false;

  // paginación
  limit = 30;
  offset = 0;
  total = 0;

  // orden idéntico al dashboard
  sortBy: string = 'idEncuesta';
  order: 'asc' | 'desc' = 'desc';

  // filtros
  filtro = {
    fechaDesde: null as string | null,
    fechaHasta: null as string | null,
    activa: null as boolean | null,
    q: '',
  };

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly roles: RolesService,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']);
    this.isCliente = this.roles.hasRole('CLIENTE');

    // No-admin (cliente o invitado): solo activas
    if (!this.isAdmin) {
      this.filtro.activa = true;
    }

    this.cargar();
  }

  // helpers/funciones
  getTituloPlano(texto: string | null | undefined): string {
    if (!texto) return 'Sin título';
    return texto.replace(/<[^>]+>/g, '').trim() || 'Sin título';
  }

  private parseDateOnly(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    // yyyy-MM-dd para comparaciones de rango
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // filtros en cliente
  private applyClientFilters(rows: EncuestaRow[]): EncuestaRow[] {
    let r = [...rows];

    if (this.filtro.fechaDesde) {
      r = r.filter(e => this.parseDateOnly(e.fechaPublicacion) >= this.filtro.fechaDesde!);
    }
    if (this.filtro.fechaHasta) {
      r = r.filter(e => this.parseDateOnly(e.fechaPublicacion) <= this.filtro.fechaHasta!);
    }
    if (this.filtro.activa !== null) {
      r = r.filter(e => e.activa === this.filtro.activa);
    }
    if (this.filtro.q?.trim()) {
      const q = this.filtro.q.trim().toLowerCase();
      r = r.filter(e => this.getTituloPlano(e.titulo).toLowerCase().includes(q));
    }

    // orden por ID desc
    r.sort((a, b) => (b.idEncuesta || 0) - (a.idEncuesta || 0));
    return r;
  }

  //Navegación
  onVolver(): void {
    if (this.isAdmin) {
      this.router.navigate(['/menu-principal/admin/biblioteca']);
    } else if (this.isCliente) {
      this.router.navigate(['/menu-principal/cliente/biblioteca']);
    } else {
      this.router.navigate(['/']);
    }
  }

  //Filtros / Paginación
  onAplicarFiltros(): void {
    this.offset = 0;
    this.cargar();
  }

  onLimpiarFiltros(): void {
    this.filtro = {
      fechaDesde: null,
      fechaHasta: null,
      activa: this.isAdmin ? null : true,
      q: '',
    };
    this.offset = 0;
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.offset === 0) return;
    this.offset = Math.max(0, this.offset - this.limit);
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.offset + this.limit >= this.total) return;
    this.offset = this.offset + this.limit;
    this.cargar();
  }

  //Acciones de fila
  onVer(e: EncuestaRow): void {
    if (this.isAdmin) {
      this.router.navigate(['/menu-principal/admin/biblioteca/encuestas/ver', e.idEncuesta]);
    } else if (this.isCliente) {
      this.router.navigate(['/menu-principal/cliente/biblioteca/encuestas/ver', e.idEncuesta]);
    } else {
      // ruta pública
      this.router.navigate(['/public/recursos/encuestas/ver', e.idEncuesta]);
    }
  }

  onEditar(e: EncuestaRow): void {
    if (!this.isAdmin) return;
    this.router.navigate(['/menu-principal/admin/biblioteca/encuestas/editar', e.idEncuesta]);
  }

  onToggleActiva(e: EncuestaRow, event: Event): void {
    if (!this.isAdmin) return;
    const input = event.target as HTMLInputElement;
    const nuevoEstado = input.checked;

    const msg = nuevoEstado
      ? '¿Querés activar la encuesta para que la ciudadanía responda?'
      : '¿Querés cerrar la encuesta? Ya no se podrá responder.';

    if (!window.confirm(msg)) {
      input.checked = e.activa;
      return;
    }

    this.http
      .patch<{ idEncuesta: number; activa: boolean }>(
        `/api/encuestas/${e.idEncuesta}/activa`,
        { activa: nuevoEstado },
      )
      .subscribe({
        next: () => this.cargar(),
        error: (err) => {
          console.error('Error cambiando estado de encuesta', err);
          alert('No se pudo cambiar el estado de la encuesta.');
          input.checked = e.activa;
        },
      });
  }

  //Carga HTTP
  private cargar(): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.markForCheck();

    let params = new HttpParams()
      .set('limit', this.limit)
      .set('offset', this.offset)
      .set('sortBy', this.sortBy)  // idEncuesta
      .set('order', this.order);   // desc

    if (this.filtro.fechaDesde) params = params.set('fechaDesde', this.filtro.fechaDesde);
    if (this.filtro.fechaHasta) params = params.set('fechaHasta', this.filtro.fechaHasta);
    if (this.filtro.activa !== null) params = params.set('activa', String(this.filtro.activa)); // "true"/"false"
    if (this.filtro.q?.trim()) params = params.set('q', this.filtro.q.trim());

    const doRequest = (p: HttpParams | null) =>
      this.http.get<PaginatedResponse<any> | any[]>('/api/encuestas', p ? { params: p } : {});

    doRequest(params).subscribe({
      next: (resp) => {
        const rawItems = Array.isArray(resp)
          ? resp
          : Array.isArray((resp as any)?.items)
          ? (resp as any).items
          : [];

        const mapped: EncuestaRow[] = rawItems.map((e: any) => ({
          idEncuesta: e.idEncuesta,
          titulo: e.titulo,
          fechaPublicacion: e.fechaPublicacion,
          fechaCierre: e.fechaCierre,
          activa: !!e.activa,
        }));

        // Filtros de refuerzo en cliente
        const filtered = this.applyClientFilters(mapped);

        // Totales: si viene filtrado del back se usa ese sino se filtra en el front
        if (Array.isArray(resp)) {
          this.total = filtered.length;
          // ventana de paginación local por si backend no paginó
          this.items = filtered.slice(0, this.limit);
          this.offset = 0;
        } else {
          // si el backend paginó, mostramos lo que hay pero ya filtrado
          this.items = filtered;
          this.total = (resp as PaginatedResponse<any>).total ?? filtered.length;
          this.limit = (resp as PaginatedResponse<any>).limit ?? this.limit;
          this.offset = (resp as PaginatedResponse<any>).offset ?? this.offset;
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        // reintento sin params si el backend se queja de los query params
        const msg = err?.error?.message;
        const is400 = err?.status === 400;
        const complainsParams =
          Array.isArray(msg) && msg.some((m: string) => /property .* should not exist/i.test(m));

        if (is400 && complainsParams) {
          doRequest(null).subscribe({
            next: (resp2) => {
              const raw2 = Array.isArray(resp2)
                ? resp2
                : Array.isArray((resp2 as any)?.items)
                ? (resp2 as any).items
                : [];
              const mapped2: EncuestaRow[] = raw2.map((e: any) => ({
                idEncuesta: e.idEncuesta,
                titulo: e.titulo,
                fechaPublicacion: e.fechaPublicacion,
                fechaCierre: e.fechaCierre,
                activa: !!e.activa,
              }));
              const filtered2 = this.applyClientFilters(mapped2);
              this.items = filtered2;
              this.total = Array.isArray(resp2) ? filtered2.length : (resp2 as any)?.total ?? filtered2.length;
              this.limit = !Array.isArray(resp2) ? (resp2 as any)?.limit ?? this.limit : this.limit;
              this.offset = !Array.isArray(resp2) ? (resp2 as any)?.offset ?? this.offset : 0;
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: (err2) => {
              console.error('Error cargando encuestas (reintento sin params)', err2);
              this.items = [];
              this.total = 0;
              this.loading = false;
              this.errorMsg = 'No se pudieron cargar las encuestas.';
              this.cdr.markForCheck();
            },
          });
        } else {
          console.error('Error cargando encuestas', err);
          this.items = [];
          this.total = 0;
          this.loading = false;
          this.errorMsg = 'No se pudieron cargar las encuestas.';
          this.cdr.markForCheck();
        }
      },
    });
  }
}
