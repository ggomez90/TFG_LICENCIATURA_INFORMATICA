import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { RolesService } from '../../../../../../auth/roles.service';
import { VoucherTipoApi } from '../../../../../../api/voucher-tipo.api';

interface AdminVoucherTipoListItem {
  idVoucherTipo: number;
  titulo: string | null;
  descripcion?: string | null;
  puntosRequeridos: number;
  montoBeneficio: number;
  fechaInicioVigencia: string | null;
  fechaFinVigencia: string | null;
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

interface TiposFilter {
  vigenciaDesde: string | null; // yyyy-MM-dd
  vigenciaHasta: string | null; // yyyy-MM-dd
  activa: boolean | null;       // null=todos
  q: string;                    // título o descripción
  puntosMin: number | null;
  puntosMax: number | null;
  beneficioMin: number | null;
  beneficioMax: number | null;
}

@Component({
  selector: 'app-listar-voucher-tipo-administrador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listar-voucher-tipo-administrador.component.html',
  styleUrls: ['./listar-voucher-tipo-administrador.component.scss'],
})
export class ListarVoucherTipoAdministradorComponent implements OnInit {
  filtro: TiposFilter = {
    vigenciaDesde: null,
    vigenciaHasta: null,
    activa: null,
    q: '',
    puntosMin: null,
    puntosMax: null,
    beneficioMin: null,
    beneficioMax: null,
  };

  items: AdminVoucherTipoListItem[] = [];
  loading = false;
  errorMsg: string | null = null;

  // 50 por página
  limit = 50;
  offset = 0;
  total = 0;

  // Orden descendente por ID (últimos creados primero)
  sortBy: string = 'idVoucherTipo';
  order: 'asc' | 'desc' = 'desc';

  isAdmin = false;
  isCliente = false;

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly roles: RolesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly voucherTipoApi: VoucherTipoApi,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']);
    this.isCliente = this.roles.hasRole('CLIENTE');
    this.cargar();
  }

  //Helpers
  getTituloPlano(titulo: string | null | undefined): string {
    if (!titulo) return 'Sin título';
    const sinTags = titulo.replace(/<[^>]+>/g, '').trim();
    return sinTags || 'Sin título';
  }

  private dateOnly(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onNumberKeydown(event: KeyboardEvent) {
    const invalid = ['.', ',', '-', 'e', '+'];
    if (invalid.includes(event.key)) event.preventDefault();
  }

  private applyClientFilters(rows: AdminVoucherTipoListItem[]): AdminVoucherTipoListItem[] {
    let r = [...rows];

    // Vigencias
    if (this.filtro.vigenciaDesde) {
      r = r.filter(e => {
        const fi = this.dateOnly(e.fechaInicioVigencia);
        return fi && fi >= this.filtro.vigenciaDesde!;
      });
    }
    if (this.filtro.vigenciaHasta) {
      r = r.filter(e => {
        const ff = this.dateOnly(e.fechaFinVigencia ?? '');
        if (!ff) return true; // sin fecha fin
        return ff <= this.filtro.vigenciaHasta!;
      });
    }

    // Activa
    if (this.filtro.activa !== null) {
      r = r.filter(e => e.activa === this.filtro.activa);
    }

    // Texto
    if (this.filtro.q?.trim()) {
      const q = this.filtro.q.trim().toLowerCase();
      r = r.filter(e =>
        this.getTituloPlano(e.titulo).toLowerCase().includes(q) ||
        (e.descripcion ?? '').toLowerCase().includes(q)
      );
    }

    // Rango puntos
    if (Number.isInteger(this.filtro.puntosMin as any)) {
      r = r.filter(e => e.puntosRequeridos >= Number(this.filtro.puntosMin));
    }
    if (Number.isInteger(this.filtro.puntosMax as any)) {
      r = r.filter(e => e.puntosRequeridos <= Number(this.filtro.puntosMax));
    }

    // Rango beneficio
    if (Number.isInteger(this.filtro.beneficioMin as any)) {
      r = r.filter(e => e.montoBeneficio >= Number(this.filtro.beneficioMin));
    }
    if (Number.isInteger(this.filtro.beneficioMax as any)) {
      r = r.filter(e => e.montoBeneficio <= Number(this.filtro.beneficioMax));
    }

    return r;
  }

  //Navegación
  onVolver(): void {
    if (this.isAdmin) {
      this.router.navigate(['/menu-principal/admin/vouchers']);
    } else if (this.isCliente) {
      this.router.navigate(['/menu-principal']);
    } else {
      this.router.navigate(['/menu-principal']);
    }
  }

  //Filtros + paginación
  onAplicarFiltros(): void {
    this.offset = 0;
    this.cargar();
  }

  onLimpiarFiltros(): void {
    this.filtro = {
      vigenciaDesde: null,
      vigenciaHasta: null,
      activa: null,
      q: '',
      puntosMin: null,
      puntosMax: null,
      beneficioMin: null,
      beneficioMax: null,
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

  //Acciones por fila
  onVer(item: AdminVoucherTipoListItem): void {
    if (!item.idVoucherTipo) return;

    this.router.navigate(
      ['/menu-principal', 'admin', 'vouchers', 'voucher-tipo', 'ver', item.idVoucherTipo],
      { state: { backTo: 'listar' } }
    );
  }

  onEditar(item: AdminVoucherTipoListItem): void {
    if (!this.isAdmin || !item.idVoucherTipo) return;

    this.router.navigate(
      ['/menu-principal', 'admin', 'vouchers', 'voucher-tipo', 'editar', item.idVoucherTipo],
      { state: { backTo: 'listar' } }
    );
  }

  onToggleActiva(item: AdminVoucherTipoListItem, event: Event): void {
    if (!this.isAdmin) {
      (event.target as HTMLInputElement).checked = item.activa;
      return;
    }
    const input = event.target as HTMLInputElement;
    const nuevoEstado = input.checked;

    const msg = nuevoEstado
      ? '¿Querés activar este tipo de voucher?'
      : '¿Querés desactivar este tipo de voucher? No estará disponible.';
    const ok = window.confirm(msg);
    if (!ok) { input.checked = item.activa; return; }

    const previo = item.activa;
    item.activa = nuevoEstado;
    this.items = this.items.map(x =>
      x.idVoucherTipo === item.idVoucherTipo ? { ...x, activa: nuevoEstado } : x
    );
    this.cdr.markForCheck();

    this.voucherTipoApi.updateActiva(item.idVoucherTipo, nuevoEstado).subscribe({
      next: () => { setTimeout(() => { this.cargar(); this.cdr.detectChanges(); }, 0); },
      error: (err) => {
        console.error('Error al actualizar activa (listado completo)', err);
        alert('Ocurrió un error al cambiar el estado. El valor volverá al anterior.');
        item.activa = previo;
        this.items = this.items.map(x =>
          x.idVoucherTipo === item.idVoucherTipo ? { ...x, activa: previo } : x
        );
        input.checked = previo;
        this.cdr.detectChanges();
      },
    });
  }

  //Carga HTTP
  private cargar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    const params: any = {
      limit: this.limit,   // 50
      offset: this.offset, // 0, 50, 100...
    };

    this.voucherTipoApi.getAll(params).subscribe({
      next: (resp: any) => {
        const src = Array.isArray(resp?.items)
          ? resp.items
          : (Array.isArray(resp) ? resp : []);

        const mapped: AdminVoucherTipoListItem[] = src.map((x: any) => ({
          idVoucherTipo: x.idVoucherTipo,
          titulo: x.titulo ?? null,
          descripcion: x.descripcion ?? null,
          puntosRequeridos: Number(x.puntosRequeridos ?? 0),
          montoBeneficio: Number(x.montoBeneficio ?? 0),
          fechaInicioVigencia: x.fechaInicioVigencia ?? null,
          fechaFinVigencia: x.fechaFinVigencia ?? null,
          activa: !!x.activa,
        }));

        let filtered = this.applyClientFilters(mapped);

        // ID desc
        filtered = filtered.sort((a, b) => (b.idVoucherTipo || 0) - (a.idVoucherTipo || 0));

        // Si el back devuelve paginado: usamos su paginación
        if (resp && Array.isArray(resp.items) && typeof resp.total === 'number') {
          this.items = filtered;
          this.total = resp.total ?? filtered.length;
          this.limit = resp.limit ?? this.limit;
          this.offset = resp.offset ?? this.offset;
        } else {
          // Si el back devuelve array: paginamos del lado cliente
          this.total = filtered.length;
          this.items = filtered.slice(this.offset, this.offset + this.limit);
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('GET /api/voucher-tipo falló:', err?.status, err?.error || err);
        this.items = [];
        this.total = 0;
        this.loading = false;
        this.errorMsg = 'Ocurrió un error al cargar el listado de tipos de voucher.';
        this.cdr.markForCheck();
      },
    });
  }
}
