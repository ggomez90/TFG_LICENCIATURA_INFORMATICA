import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RolesService } from '../../../auth/roles.service';
import {
  DesafioApi,
  DesafioItem,
  DesafioListResponse,
  DesafioListParams,
} from '../../../api/desafio.api';

type EstadoFiltro = null | 1 | 2 | 3; // null=todos
type BinFiltro = null | 0 | 1;        // null=todos, 1=si, 0=no

interface DesafiosFilter {
  fechaDesde: string | null;     // yyyy-MM-dd
  fechaHasta: string | null;     // yyyy-MM-dd
  estado: EstadoFiltro;          // puede venir como string desde ngModel hay que forzar a number
  requiereInscripcion: BinFiltro;
  q: string;
  tipoResiduo: string;
}

@Component({
  selector: 'app-listar-desafios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listar-desafios.component.html',
  styleUrls: ['./listar-desafios.component.scss'],
})
export class ListarDesafiosComponent implements OnInit {
  // filtros
  filtro: DesafiosFilter = {
    fechaDesde: null,
    fechaHasta: null,
    estado: null,
    requiereInscripcion: null,
    q: '',
    tipoResiduo: '',
  };

  // data
  items: DesafioItem[] = [];
  total = 0;
  limit = 50;    // 50 por página
  offset = 0;

  loading = false;
  errorMsg: string | null = null;

  // roles
  isAdmin = false;

  constructor(
    private readonly api: DesafioApi,
    private readonly router: Router,
    private readonly roles: RolesService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']);
    this.cargar();
  }

  //helpers

  /** Normaliza un posible string de ngModel a 1, 2, 3 o null */
  private getEstadoNum(): 1 | 2 | 3 | null {
    const raw = this.filtro.estado as any;
    if (raw === null || raw === undefined || raw === '') return null;
    const n = Number(raw);
    return (n === 1 || n === 2 || n === 3) ? n : null;
  }

  getTituloPlano(titulo: string | null | undefined): string {
    if (!titulo) return 'Sin título';
    const sinTags = titulo.replace(/<[^>]+>/g, '').trim();
    return sinTags || 'Sin título';
  }

  // yyyy-MM-dd para comparar rango rápidamente
  private toYmd(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Refuerzo de filtros en cliente
  private applyClientFilters(rows: DesafioItem[]): DesafioItem[] {
    let r = [...rows];

    if (this.filtro.fechaDesde) {
      r = r.filter(x => this.toYmd(x.fechaInicio) >= this.filtro.fechaDesde!);
    }
    if (this.filtro.fechaHasta) {
      r = r.filter(x => this.toYmd(x.fechaInicio) <= this.filtro.fechaHasta!);
    }
    // Estado forzado a number (1/2/3)
    const est = this.getEstadoNum();
    if (est !== null) {
      r = r.filter(x => Number(x.estado) === est);
    }
    if (this.filtro.requiereInscripcion != null) {
      const want = this.filtro.requiereInscripcion === 1;
      r = r.filter(x => !!x.requiereInscripcion === want);
    }
    if (this.filtro.tipoResiduo.trim()) {
      const qtr = this.filtro.tipoResiduo.trim().toLowerCase();
      r = r.filter(x => (x.tipoResiduo || '').toLowerCase().includes(qtr));
    }
    if (this.filtro.q.trim()) {
      const q = this.filtro.q.trim().toLowerCase();
      r = r.filter(x =>
        this.getTituloPlano(x.titulo).toLowerCase().includes(q) ||
        (x.descripcion || '').toLowerCase().includes(q)
      );
    }

    // Orden descendente local por id (más recientes primero)
    r.sort((a, b) => b.idDesafio - a.idDesafio);
    return r;
  }

  //navegación

  onVolver(): void {
    this.router.navigate(['/menu-principal', 'admin', 'desafios']);
  }

  onVer(item: DesafioItem): void {
    this.router.navigate(
      ['/menu-principal', 'admin', 'desafios', 'ver', item.idDesafio],
      { state: { item, from: 'listado' } } // marcador para decidir el volver
    );
  }

  onEditar(item: DesafioItem): void {
    if (!this.isAdmin) return;
    this.router.navigate(
      ['/menu-principal', 'admin', 'desafios', 'editar', item.idDesafio],
      { state: { item, from: 'listado' } } // marcador para decidir volver + guardar y volver
    );
  }

  //filtros / paginación

  onAplicarFiltros(): void {
    this.offset = 0;
    this.cargar();
  }

  onLimpiarFiltros(): void {
    this.filtro = {
      fechaDesde: null,
      fechaHasta: null,
      estado: null,
      requiereInscripcion: null,
      q: '',
      tipoResiduo: '',
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

  //carga

  private cargar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    const params: DesafioListParams = {
      limit: this.limit,
      offset: this.offset,
    };

    const est = this.getEstadoNum();
    if (est !== null) params.estado = est as 1 | 2 | 3;
    if (this.filtro.q.trim()) params.q = this.filtro.q.trim();
    if (this.filtro.fechaDesde) params.fechaDesde = this.filtro.fechaDesde;
    if (this.filtro.fechaHasta) params.fechaHasta = this.filtro.fechaHasta;
    if (this.filtro.requiereInscripcion != null) params.requiereInscripcion = this.filtro.requiereInscripcion;
    if (this.filtro.tipoResiduo.trim()) params.tipoResiduo = this.filtro.tipoResiduo.trim();

    this.api.listDesafios(params).subscribe({
      next: (resp: DesafioListResponse) => {
        const filtered = this.applyClientFilters(resp.items || []);

        // Si el back pagina mejor y sino paginamos local (esta funcionando siempre con paginacion local, el sortBy y orden del back vienen con warning y errores)
        if (typeof resp.total === 'number' && typeof resp.limit === 'number') {
          this.items = filtered;
          this.total = resp.total;
          this.limit = resp.limit || this.limit;
          this.offset = resp.offset || this.offset;
        } else {
          this.total = filtered.length;
          this.items = filtered.slice(this.offset, this.offset + this.limit);
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err?.error?.message;
        const is400 = err?.status === 400;
        const complainsParams =
          Array.isArray(msg) && msg.some((m: string) => /property .* should not exist/i.test(m));

        if (is400 && complainsParams) {
          this.api.listDesafios({}).subscribe({
            next: (resp2) => {
              const items = (resp2 as any).items ?? (resp2 as any) ?? [];
              const filtered2 = this.applyClientFilters(items);
              this.total = filtered2.length;
              this.items = filtered2.slice(this.offset, this.offset + this.limit);
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: (err2) => {
              console.error('Error cargando desafíos (fallback sin params)', err2);
              this.items = [];
              this.total = 0;
              this.loading = false;
              this.errorMsg = 'Ocurrió un error al cargar el listado de desafíos.';
              this.cdr.markForCheck();
            },
          });
        } else {
          console.error('Error cargando desafíos', err);
          this.items = [];
          this.total = 0;
          this.loading = false;
          this.errorMsg = 'Ocurrió un error al cargar el listado de desafíos.';
          this.cdr.markForCheck();
        }
      },
    });
  }
}
