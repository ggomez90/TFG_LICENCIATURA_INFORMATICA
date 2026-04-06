import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RolesService } from '../../../../../../auth/roles.service';
import { VoucherApi, VoucherListItem } from '../../../../../../api/voucher.api';

type EstadoVoucherCode = 1 | 2 | 3 | 4; // 1 CREADO, 2 ADQUIRIDO, 3 UTILIZADO, 4 ANULADO

interface AdminVoucherListItem {
  idVoucher: number;
  idCliente: number;
  idVoucherTipo: number;
  estadoVoucher: EstadoVoucherCode;
  fechaAdquisicion: string;     // ISO
  fechaUso?: string | null;     // ISO o null
  voucherTipo?: { idVoucherTipo: number; titulo: string };
}

interface VouchersFilter {
  fechaDesde: string | null; // yyyy-MM-dd
  fechaHasta: string | null; // yyyy-MM-dd

  // filtros por ids
  idCliente: number | null;
  idVoucherTipo: number | null;

  // estado
  estado: EstadoVoucherCode | null;

  // busqueda texto (id / tipo titulo)
  q: string;
}

@Component({
  selector: 'app-listar-voucher-administrador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listar-voucher-administrador.component.html',
  styleUrls: ['./listar-voucher-administrador.component.scss'],
})
export class ListarVoucherAdministradorComponent implements OnInit {
  filtro: VouchersFilter = {
    fechaDesde: null,
    fechaHasta: null,
    idCliente: null,
    idVoucherTipo: null,
    estado: null,
    q: '',
  };

  items: AdminVoucherListItem[] = [];
  loading = false;
  errorMsg: string | null = null;

  // 50 por página
  limit = 50;
  offset = 0;
  total = 0;

  isAdmin = false;
  isCliente = false;

  constructor(
    private readonly router: Router,
    private readonly roles: RolesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly voucherApi: VoucherApi,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']);
    this.isCliente = this.roles.hasRole('CLIENTE');
    this.cargar();
  }

  //Helpers
  onNumberKeydown(event: KeyboardEvent) {
    const invalid = ['.', ',', '-', 'e', '+'];
    if (invalid.includes(event.key)) event.preventDefault();
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

  estadoLabel(e: EstadoVoucherCode): string {
    switch (Number(e)) {
      case 1: return 'CREADO';
      case 2: return 'ADQUIRIDO';
      case 3: return 'UTILIZADO';
      case 4: return 'ANULADO';
      default: return '—';
    }
  }

  badgeClass(e: EstadoVoucherCode): string {
    switch (Number(e)) {
      case 3: return 'dsf-badge--ok';     // UTILIZADO
      case 2: return 'dsf-badge--ok';     // ADQUIRIDO
      case 1: return 'dsf-badge--muted';  // CREADO
      case 4: return 'dsf-badge--muted';  // ANULADO
      default: return 'dsf-badge--muted';
    }
  }

  private applyClientFilters(rows: AdminVoucherListItem[]): AdminVoucherListItem[] {
    let r = [...rows];

    // rango por fechaAdquisicion
    if (this.filtro.fechaDesde) {
      r = r.filter(v => {
        const fa = this.dateOnly(v.fechaAdquisicion);
        return fa && fa >= this.filtro.fechaDesde!;
      });
    }
    if (this.filtro.fechaHasta) {
      r = r.filter(v => {
        const fa = this.dateOnly(v.fechaAdquisicion);
        return fa && fa <= this.filtro.fechaHasta!;
      });
    }

    // ids
    if (Number.isInteger(this.filtro.idCliente as any)) {
      const id = Number(this.filtro.idCliente);
      r = r.filter(v => Number(v.idCliente) === id);
    }
    if (Number.isInteger(this.filtro.idVoucherTipo as any)) {
      const id = Number(this.filtro.idVoucherTipo);
      r = r.filter(v => Number(v.idVoucherTipo) === id);
    }

    // estado
    if (this.filtro.estado !== null) {
      r = r.filter(v => Number(v.estadoVoucher) === Number(this.filtro.estado));
    }

    // texto
    if (this.filtro.q?.trim()) {
      const q = this.filtro.q.trim().toLowerCase();
      r = r.filter(v => {
        const idVoucher = String(v.idVoucher ?? '');
        const idCliente = String(v.idCliente ?? '');
        const idTipo = String(v.idVoucherTipo ?? '');
        const tituloTipo = String(v.voucherTipo?.titulo ?? '').toLowerCase();
        return (
          idVoucher.includes(q) ||
          idCliente.includes(q) ||
          idTipo.includes(q) ||
          tituloTipo.includes(q)
        );
      });
    }

    return r;
  }

  // Navegación
  onVolver(): void {
    if (this.isAdmin) {
      this.router.navigate(['/menu-principal/admin/vouchers']);
    } else if (this.isCliente) {
      this.router.navigate(['/menu-principal']);
    } else {
      this.router.navigate(['/menu-principal']);
    }
  }

  // Filtros + paginación
  onAplicarFiltros(): void {
    this.offset = 0;
    this.cargar();
  }

  onLimpiarFiltros(): void {
    this.filtro = {
      fechaDesde: null,
      fechaHasta: null,
      idCliente: null,
      idVoucherTipo: null,
      estado: null,
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

  // Acciones por fila
  onVer(item: AdminVoucherListItem): void {
    if (!item.idVoucher) return;
    this.router.navigate(
      ['/menu-principal', 'admin', 'vouchers', 'voucher', 'ver', item.idVoucher],
      { state: { backTo: 'listar' } }
    );
  }

  onEditar(item: AdminVoucherListItem): void {
    if (!this.isAdmin || !item.idVoucher) return;
    this.router.navigate(
      ['/menu-principal', 'admin', 'vouchers', 'voucher', 'editar', item.idVoucher],
      { state: { backTo: 'listar' } }
    );
  }

  // Carga HTTP
  private cargar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    const reqLimit = 100;

    const params: any = {
      limit: reqLimit,
      offset: 0,
    };

    this.voucherApi.list(params).subscribe({
      next: (resp: any) => {
        const src = Array.isArray(resp?.items)
          ? resp.items
          : (Array.isArray(resp) ? resp : []);

        const mapped: AdminVoucherListItem[] = (src ?? []).map((x: VoucherListItem | any) => ({
          idVoucher: Number(x.idVoucher ?? 0),
          idCliente: Number(x.idCliente ?? 0),
          idVoucherTipo: Number(x.idVoucherTipo ?? 0),
          estadoVoucher: Number(x.estadoVoucher ?? 0) as EstadoVoucherCode,
          fechaAdquisicion: String(x.fechaAdquisicion ?? ''),
          fechaUso: x.fechaUso ?? null,
          voucherTipo: x.voucherTipo
            ? { idVoucherTipo: Number(x.voucherTipo.idVoucherTipo ?? x.idVoucherTipo), titulo: String(x.voucherTipo.titulo ?? '') }
            : undefined,
        }));

        // filtros client-side
        let filtered = this.applyClientFilters(mapped);

        // orden fijo: ID desc
        filtered = filtered.sort((a, b) => (b.idVoucher || 0) - (a.idVoucher || 0));

        // paginación client-side
        this.total = filtered.length;
        this.items = filtered.slice(this.offset, this.offset + this.limit);

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('GET /api/vouchers falló:', err?.status, err?.error || err);
        this.items = [];
        this.total = 0;
        this.loading = false;
        this.errorMsg = 'Ocurrió un error al cargar el listado de vouchers.';
        this.cdr.markForCheck();
      },
    });
  }
}
