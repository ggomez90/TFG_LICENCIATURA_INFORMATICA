import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContenidoApi, ContenidoListResponse } from '../../../../api/contenido.api';
import { EncuestaApi, EncuestaListResponse, EncuestaItem } from '../../../../api/encuesta.api';

interface AdminContenidoListItem {
  idContenido: number;
  titulo: string | null;
  descripcion?: string | null;
  fechaPublicacion: string;
  visible: boolean;
}

interface AdminEncuestaListItem {
  idEncuesta: number;
  titulo: string;
  fechaPublicacion: string;
  fechaCierre: string;
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

interface ContenidosFilter {
  fechaDesde: string | null;
  fechaHasta: string | null;
  visible: boolean | null;
  q: string;
}

interface EncuestasFilter {
  fechaDesde: string | null;
  fechaHasta: string | null;
  activa: boolean | null;
  q: string;
}

@Component({
  selector: 'app-biblioteca-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './biblioteca-administrador.component.html',
  styleUrls: ['./biblioteca-administrador.component.scss'],
})
export class BibliotecaAdministradorComponent implements OnInit {
  constructor(
    private readonly contenidoApi: ContenidoApi,
    private readonly encuestaApi: EncuestaApi,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // estado interno 
  private _contenidos: AdminContenidoListItem[] = [];
  private _encuestas: AdminEncuestaListItem[] = [];

  // flags de loading
  private _loadingContenidos = false;
  private _loadingEncuestas = false;

  // mostrar/ocultar filtros
  private _mostrarFiltrosContenidos = false;
  private _mostrarFiltrosEncuestas = false;

  // modelos de filtros
  filtroContenidos: ContenidosFilter = {
    fechaDesde: null,
    fechaHasta: null,
    visible: null,
    q: '',
  };

  filtroEncuestas: EncuestasFilter = {
    fechaDesde: null,
    fechaHasta: null,
    activa: null,
    q: '',
  };

  ngOnInit(): void {
    this.cargarContenidos();
    this.cargarEncuestas();
  }

  // GETTERS usados por el HTML
  contenidos(): AdminContenidoListItem[] { return this._contenidos; }
  encuestas(): AdminEncuestaListItem[] { return this._encuestas; }
  loadingContenidos(): boolean { return this._loadingContenidos; }
  loadingEncuestas(): boolean { return this._loadingEncuestas; }
  mostrarFiltrosContenidos(): boolean { return this._mostrarFiltrosContenidos; }
  mostrarFiltrosEncuestas(): boolean { return this._mostrarFiltrosEncuestas; }

  // HELPERS/FUNCIONES
  private stripHtml(input: string | null | undefined): string {
    if (!input) return 'Sin título';
    const plain = input.replace(/<[^>]+>/g, '').trim();
    return plain || 'Sin título';
  }

  // ACCIONES Y CONTENIDOS 
  toggleFiltrosContenidos(): void { this._mostrarFiltrosContenidos = !this._mostrarFiltrosContenidos; }
  onFiltrarContenidos(): void { this.cargarContenidos(); }
  onLimpiarFiltrosContenidos(): void {
    this.filtroContenidos = { fechaDesde: null, fechaHasta: null, visible: null, q: '' };
    this.cargarContenidos();
  }
  onCrearContenido(): void {
    this.router.navigate(['/menu-principal/admin/biblioteca/contenidos/nuevo']);
  }
  onVerMasContenidos(): void {
    this.router.navigate(['/menu-principal/biblioteca/contenidos']);
  }
  onVerContenido(c: AdminContenidoListItem): void {
    if (!c.idContenido) return;
    this.router.navigate(['/menu-principal/admin/biblioteca/contenidos/ver', c.idContenido]);
  }
  onEditarContenido(c: AdminContenidoListItem): void {
    if (!c.idContenido) return;
    this.router.navigate([
      '/menu-principal','admin','biblioteca','contenidos','editar',c.idContenido,
    ]);
  }
  onToggleVisibleContenidoConfirm(c: AdminContenidoListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevoEstado = input.checked;
    const mensaje = nuevoEstado
      ? '¿Querés publicar este contenido y hacerlo visible en la biblioteca para la ciudadanía?'
      : '¿Querés ocultar este contenido de la biblioteca? Las personas dejarán de verlo.';
    const confirmado = window.confirm(mensaje);
    if (!confirmado) {
      input.checked = c.visible;
      return;
    }

    this.contenidoApi
      .updateVisible(c.idContenido, { visible: nuevoEstado })
      .subscribe({
        next: () => { this.cargarContenidos(); },
        error: (err) => {
          console.error('Error al actualizar visibilidad de contenido', err);
          alert('Ocurrió un error al cambiar la visibilidad. El estado volverá al valor anterior.');
          input.checked = c.visible;
          this.cdr.markForCheck();
        },
      });
  }

  // ACCIONES Y ENCUESTAS
  toggleFiltrosEncuestas(): void { this._mostrarFiltrosEncuestas = !this._mostrarFiltrosEncuestas; }
  onFiltrarEncuestas(): void { this.cargarEncuestas(); }
  onLimpiarFiltrosEncuestas(): void {
    this.filtroEncuestas = { fechaDesde: null, fechaHasta: null, activa: null, q: '' };
    this.cargarEncuestas();
  }
  onCrearEncuesta(): void {
    this.router.navigate(['/menu-principal/admin/biblioteca/encuestas/nueva']);
  }
  onVerMasEncuestas(): void {
    this.router.navigate(['/menu-principal/biblioteca/encuestas']);
  }
  onVerEncuesta(e: AdminEncuestaListItem): void {
    if (!e.idEncuesta) return;
    this.router.navigate(['/menu-principal/biblioteca/encuestas/ver', e.idEncuesta]);
  }
  onEditarEncuesta(e: AdminEncuestaListItem): void {
    if (!e.idEncuesta) return;
    this.router.navigate([
      '/menu-principal','admin','biblioteca','encuestas','editar',e.idEncuesta,
    ]);
  }
  onToggleActivaEncuestaConfirm(e: AdminEncuestaListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevoEstado = input.checked;
    const msg = nuevoEstado
      ? '¿Querés activar esta encuesta para que esté disponible?'
      : '¿Querés cerrar esta encuesta? Las personas no podrán responderla.';
    const confirmado = window.confirm(msg);
    if (!confirmado) {
      input.checked = e.activa;
      return;
    }

    this.encuestaApi
      .updateActiva(e.idEncuesta, { activa: nuevoEstado })
      .subscribe({
        next: () => { this.cargarEncuestas(); },
        error: (err) => {
          console.error('Error al actualizar estado de encuesta', err);
          alert('Ocurrió un error al cambiar el estado. Se revertirá al valor anterior.');
          input.checked = e.activa;
          this.cdr.markForCheck();
        },
      });
  }

  // LLAMADAS HTTP Y CONTENIDOS
  private cargarContenidos(): void {
    this._loadingContenidos = true;
    this.cdr.markForCheck();

    const params = {
      limit: 50,
      offset: 0,
      ...(this.filtroContenidos.fechaDesde ? { fechaDesde: this.filtroContenidos.fechaDesde } : {}),
      ...(this.filtroContenidos.fechaHasta ? { fechaHasta: this.filtroContenidos.fechaHasta } : {}),
      ...(this.filtroContenidos.visible !== null
          ? { visible: this.filtroContenidos.visible ? 1 : 0 }
          : {}),
      ...(this.filtroContenidos.q?.trim() ? { q: this.filtroContenidos.q.trim() } : {}),
    };

    this.contenidoApi
      .listAdmin(params)
      .subscribe({
        next: (resp: ContenidoListResponse) => {
          const items = (resp.items ?? []).map((raw: any) => {
            return {
              idContenido: raw.idContenidoEducativo,
              titulo: this.stripHtml(raw.titulo ?? null),
              descripcion: raw.descripcion ?? null,
              fechaPublicacion: raw.fechaPublicacion,
              visible: raw.visible,
            } as AdminContenidoListItem;
          });

          // Orden por ID DESC y solo 10
          this._contenidos = items
            .sort((a, b) => (b.idContenido || 0) - (a.idContenido || 0))
            .slice(0, 10);

          this._loadingContenidos = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error cargando contenidos educativos', err);
          this._contenidos = [];
          this._loadingContenidos = false;
          this.cdr.markForCheck();
        },
      });
  }

  // LLAMADAS HTTP Y ENCUESTAS
  private cargarEncuestas(): void {
    this._loadingEncuestas = true;
    this.cdr.markForCheck();

    const baseParams = {
      limit: 50,
      offset: 0,
      ...(this.filtroEncuestas.fechaDesde ? { fechaDesde: this.filtroEncuestas.fechaDesde } : {}),
      ...(this.filtroEncuestas.fechaHasta ? { fechaHasta: this.filtroEncuestas.fechaHasta } : {}),
      ...(this.filtroEncuestas.activa !== null ? { activa: this.filtroEncuestas.activa } : {}),
      ...(this.filtroEncuestas.q?.trim() ? { q: this.filtroEncuestas.q.trim() } : {}),
    };

    const doRequest = (useParams: any | null) =>
      this.encuestaApi.list(useParams ?? {});

    // Primer intento con params
    doRequest(baseParams).subscribe({
      next: (resp) => {
        const src = Array.isArray((resp as any)?.items)
          ? (resp as any).items
          : (Array.isArray(resp) ? resp : []);

        const list = src.map((it: any) => ({
          idEncuesta: it.idEncuesta,
          titulo: this.stripHtml(it.titulo ?? '(Sin título)'),
          fechaPublicacion: it.fechaPublicacion,
          fechaCierre: it.fechaCierre,
          activa: Boolean(it.activa),
        })) as AdminEncuestaListItem[];

        //Orden por ID DESC y solo 10
        this._encuestas = list
          .sort((a, b) => (b.idEncuesta || 0) - (a.idEncuesta || 0))
          .slice(0, 10);

        this._loadingEncuestas = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err?.error?.message;
        const is400 = err?.status === 400;
        const complainsParams =
          Array.isArray(msg) && msg.some((m: string) => /property .* should not exist/i.test(m));

        if (is400 && complainsParams) {
          // Reintento sin params (se mantiene el orden por ID desc del lado del cliente)
          doRequest(null).subscribe({
            next: (resp2) => {
              const src2 = Array.isArray((resp2 as any)?.items)
                ? (resp2 as any).items
                : (Array.isArray(resp2) ? resp2 : []);

              const list2 = src2.map((it: any) => ({
                idEncuesta: it.idEncuesta,
                titulo: this.stripHtml(it.titulo ?? '(Sin título)'),
                fechaPublicacion: it.fechaPublicacion,
                fechaCierre: it.fechaCierre,
                activa: Boolean(it.activa),
              })) as AdminEncuestaListItem[];

              this._encuestas = list2
                .sort((a, b) => (b.idEncuesta || 0) - (a.idEncuesta || 0))
                .slice(0, 10);

              this._loadingEncuestas = false;
              this.cdr.markForCheck();
            },
            error: (err2) => {
              console.error('Error cargando encuestas (reintento sin params)', err2);
              this._encuestas = [];
              this._loadingEncuestas = false;
              this.cdr.markForCheck();
            },
          });
        } else {
          console.error('Error cargando encuestas', err);
          this._encuestas = [];
          this._loadingEncuestas = false;
          this.cdr.markForCheck();
        }
      },
    });
  }
}
