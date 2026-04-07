import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RolesService } from '../../../auth/roles.service';
import { FooterInvitadoComponent } from '../roles/invitado/footer-invitado.component';

interface AdminContenidoListItem {
  idContenido: number;
  titulo: string | null;
  descripcion?: string | null;
  fechaPublicacion: string;
  visible: boolean;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

interface ContenidosFilter {
  fechaDesde: string | null;
  fechaHasta: string | null;
  visible: boolean | null;
  q: string;
}

@Component({
  selector: 'app-listar-contenido-educativo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, FooterInvitadoComponent],
  templateUrl: './listar-contenido-educativo.component.html',
  styleUrls: ['./listar-contenido-educativo.component.scss'],
})
export class ListarContenidoEducativoComponent implements OnInit {
  filtro: ContenidosFilter = {
    fechaDesde: null,
    fechaHasta: null,
    visible: null,
    q: '',
  };

  items: AdminContenidoListItem[] = [];
  loading = false;
  errorMsg: string | null = null;

  limit = 30;
  offset = 0;
  total = 0;

  sortBy: string = 'fechaPublicacion';
  order: 'asc' | 'desc' = 'desc';

  isAdmin = false;
  isCliente = false;
  isGuest = false;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly roles: RolesService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']);
    this.isCliente = this.roles.hasRole('CLIENTE');
    this.isGuest = !this.isAdmin && !this.isCliente && this.router.url.startsWith('/invitado');

    if (!this.isAdmin) {
      this.filtro.visible = true;
    }

    this.cargar();
  }

  getTituloPlano(titulo: string | null | undefined): string {
    if (!titulo) return 'Sin título';
    const sinTags = titulo.replace(/<[^>]+>/g, '').trim();
    return sinTags || 'Sin título';
  }

  private parseDateOnly(iso: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private applyClientFilters(rows: AdminContenidoListItem[]): AdminContenidoListItem[] {
    let r = [...rows];

    if (this.filtro.fechaDesde) {
      r = r.filter(e => this.parseDateOnly(e.fechaPublicacion) >= this.filtro.fechaDesde!);
    }
    if (this.filtro.fechaHasta) {
      r = r.filter(e => this.parseDateOnly(e.fechaPublicacion) <= this.filtro.fechaHasta!);
    }
    if (this.filtro.visible !== null) {
      r = r.filter(e => e.visible === this.filtro.visible);
    }
    if (this.filtro.q?.trim()) {
      const q = this.filtro.q.trim().toLowerCase();
      r = r.filter(e =>
        this.getTituloPlano(e.titulo).toLowerCase().includes(q) ||
        (e.descripcion ?? '').toLowerCase().includes(q)
      );
    }

    return r;
  }

  onVolver(): void {
    if (this.isAdmin) {
      this.router.navigate(['/menu-principal/admin/biblioteca']);
    } else if (this.isCliente) {
      this.router.navigate(['/menu-principal/cliente/biblioteca']);
    } else if (this.isGuest) {
      this.router.navigate(['/invitado/biblioteca']);
    } else {
      this.router.navigate(['/menu-principal']);
    }
  }

  onAplicarFiltros(): void {
    this.offset = 0;
    this.cargar();
  }

  onLimpiarFiltros(): void {
    this.filtro = {
      fechaDesde: null,
      fechaHasta: null,
      visible: this.isAdmin ? null : true,
      q: '',
    };
    this.offset = 0;
    this.cargar();
  }

  paginaSiguiente(): void {
    if (this.offset + this.limit >= this.total) return;
    this.offset += this.limit;
    this.cargar();
  }

  paginaAnterior(): void {
    if (this.offset === 0) return;
    this.offset = Math.max(0, this.offset - this.limit);
    this.cargar();
  }

  onVer(item: AdminContenidoListItem): void {
    if (!item.idContenido) return;

    if (this.isAdmin) {
      this.router.navigate(['/menu-principal/admin/biblioteca/contenidos/ver', item.idContenido]);
      return;
    }

    if (this.isCliente) {
      this.router.navigate(['/menu-principal/cliente/biblioteca/contenidos/ver', item.idContenido]);
      return;
    }

    this.router.navigate(['/invitado/biblioteca/contenidos/ver', item.idContenido]);
  }

  onEditar(item: AdminContenidoListItem): void {
    if (!this.isAdmin || !item.idContenido) return;

    this.router.navigate([
      '/menu-principal',
      'admin',
      'biblioteca',
      'contenidos',
      'editar',
      item.idContenido,
    ]);
  }

  onToggleVisible(item: AdminContenidoListItem, event: Event): void {
    if (!this.isAdmin) {
      (event.target as HTMLInputElement).checked = item.visible;
      return;
    }

    const input = event.target as HTMLInputElement;
    const nuevoEstado = input.checked;

    const mensaje = nuevoEstado
      ? '¿Querés publicar este contenido y hacerlo visible en la biblioteca para la ciudadanía?'
      : '¿Querés ocultar este contenido de la biblioteca? Las personas dejarán de verlo.';

    const confirmado = window.confirm(mensaje);

    if (!confirmado) {
      input.checked = item.visible;
      return;
    }

    this.http
      .patch<{ idContenido: number; visible: boolean }>(
        `/api/contenidos/${item.idContenido}/visible`,
        { visible: nuevoEstado },
      )
      .subscribe({
        next: () => { this.cargar(); },
        error: (err) => {
          console.error('Error al actualizar visibilidad de contenido (listado completo)', err);
          alert('Ocurrió un error al cambiar la visibilidad. El estado volverá al valor anterior.');
          input.checked = item.visible;
        },
      });
  }

  private cargar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    const isPublic = !this.isAdmin;

    if (!isPublic) {
      let params = new HttpParams()
        .set('limit', this.limit)
        .set('offset', this.offset)
        .set('sortBy', this.sortBy)
        .set('order', this.order);

      if (this.filtro.fechaDesde) params = params.set('fechaDesde', this.filtro.fechaDesde);
      if (this.filtro.fechaHasta) params = params.set('fechaHasta', this.filtro.fechaHasta);
      if (this.filtro.visible !== null) params = params.set('visible', this.filtro.visible ? '1' : '0');
      if (this.filtro.q?.trim()) params = params.set('q', this.filtro.q.trim());

      this.http.get<PaginatedResponse<any> | any[]>('/api/contenidos/admin', { params }).subscribe({
        next: (resp) => {
          const rawItems = Array.isArray(resp)
            ? resp
            : Array.isArray((resp as any)?.items)
            ? (resp as any).items
            : [];

          const mapped: AdminContenidoListItem[] = rawItems.map((raw: any) => ({
            idContenido: raw.idContenidoEducativo,
            titulo: raw.titulo ?? null,
            descripcion: raw.descripcion ?? null,
            fechaPublicacion: raw.fechaPublicacion,
            visible: !!raw.visible,
          }));

          const filtered = this.applyClientFilters(mapped);

          if (Array.isArray(resp)) {
            this.total = filtered.length;
            this.items = filtered.slice(this.offset, this.offset + this.limit);
          } else {
            this.items = filtered;
            this.total = (resp as PaginatedResponse<any>).total ?? filtered.length;
            this.limit = (resp as PaginatedResponse<any>).limit ?? this.limit;
            this.offset = (resp as PaginatedResponse<any>).offset ?? this.offset;
          }

          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error cargando contenidos (admin)', err);
          this.items = [];
          this.total = 0;
          this.loading = false;
          this.errorMsg = 'Ocurrió un error al cargar el listado de contenidos.';
          this.cdr.markForCheck();
        },
      });

      return;
    }

    this.http.get<any[]>('/api/contenidos').subscribe({
      next: (resp) => {
        const rawItems = Array.isArray(resp) ? resp : [];

        const mapped: AdminContenidoListItem[] = rawItems.map((raw: any) => ({
          idContenido: raw.idContenidoEducativo ?? raw.idContenido ?? raw.id ?? 0,
          titulo: raw.titulo ?? null,
          descripcion: raw.descripcion ?? null,
          fechaPublicacion: raw.fechaPublicacion,
          visible: raw.visible !== undefined ? !!raw.visible : true,
        }));

        const forced = mapped.filter((x) => x.visible);
        const filtered = this.applyClientFilters(forced);

        this.total = filtered.length;
        this.items = filtered.slice(this.offset, this.offset + this.limit);

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando contenidos (public)', err);
        this.items = [];
        this.total = 0;
        this.loading = false;
        this.errorMsg = 'Ocurrió un error al cargar el listado de contenidos.';
        this.cdr.markForCheck();
      },
    });
  }
}