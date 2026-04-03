import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoucherApi, VoucherListItem } from '../../../../../api/voucher.api';

type EstadoVoucher = 'ADQUIRIDO' | 'UTILIZADO' | 'ANULADO';

interface VoucherClienteVm {
  idVoucher: number;
  codigo: string;
  tipoTitulo: string;
  estado: EstadoVoucher;
  fechaAdquisicion: string;
  fechaUso?: string | null;
  puntosRequeridos: number;
  montoBeneficio: number;
}

@Component({
  standalone: true,
  selector: 'app-listar-voucher-cliente',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './listar-voucher-cliente.component.html',
  styleUrls: ['./listar-voucher-cliente.component.scss'],
})
export class ListarVoucherClienteComponent {
  private router = inject(Router);
  private voucherApi = inject(VoucherApi);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;

  filtroEstado = signal<'TODOS' | EstadoVoucher>('TODOS');
  busqueda = signal('');

  vouchers = signal<VoucherClienteVm[]>([]);

  vouchersFiltrados = computed(() => {
    const q = this.busqueda().trim().toLowerCase();
    let items = [...this.vouchers()];

    if (this.filtroEstado() !== 'TODOS') {
      items = items.filter(v => v.estado === this.filtroEstado());
    }

    if (q) {
      items = items.filter(v =>
        v.codigo.toLowerCase().includes(q) ||
        v.tipoTitulo.toLowerCase().includes(q)
      );
    }

    return items;
  });

  cantidadAdquiridos = computed(() =>
    this.vouchers().filter(v => v.estado === 'ADQUIRIDO').length
  );

  cantidadUtilizados = computed(() =>
    this.vouchers().filter(v => v.estado === 'UTILIZADO').length
  );

  cantidadAnulados = computed(() =>
    this.vouchers().filter(v => v.estado === 'ANULADO').length
  );

  constructor() {
    this.cargarVouchers();
  }

  cargarVouchers(): void {
    this.loading = true;
    this.error = null;

    this.voucherApi.list({
      limit: 100,
      offset: 0,
      sortBy: 'fechaAdquisicion',
      order: 'desc',
    }).subscribe({
      next: (resp) => {
        const items: VoucherClienteVm[] = (resp?.items ?? []).map((item: VoucherListItem) => ({
          idVoucher: item.idVoucher,
          codigo: String(item.idVoucher),
          tipoTitulo: item.voucherTipo?.titulo ?? `Tipo #${item.idVoucherTipo}`,
          estado: (
            item.estadoVoucher === 3
              ? 'UTILIZADO'
              : item.estadoVoucher === 4
                ? 'ANULADO'
                : 'ADQUIRIDO'
          ) as EstadoVoucher,
          fechaAdquisicion: item.fechaAdquisicion,
          fechaUso: item.fechaUso ?? null,
          puntosRequeridos: Number(item.voucherTipo?.puntosRequeridos ?? 0),
          montoBeneficio: Number(item.voucherTipo?.montoBeneficio ?? 0),
        }));

        this.vouchers.set(items);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[ListarVoucherCliente] Error cargando vouchers', err);
        this.error = err?.error?.message ?? 'No se pudieron cargar los vouchers.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  irAlDashboard(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers']);
  }

  irADisponibles(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/disponibles']);
  }

  verVoucher(idVoucher: number): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/ver', idVoucher]);
  }

  anularVoucher(idVoucher: number): void {
    this.voucherApi.anularCliente(idVoucher).subscribe({
      next: () => {
        this.cargarVouchers();
      },
      error: (err) => {
        console.error('[ListarVoucherCliente] Error anulando voucher', err);
        this.error = err?.error?.message ?? 'No se pudo anular el voucher.';
        this.cdr.detectChanges();
      }
    });
  }

  puedeAnular(item: VoucherClienteVm): boolean {
    return item.estado === 'ADQUIRIDO';
  }

  getEstadoClase(estado: EstadoVoucher): string {
    switch (estado) {
      case 'ADQUIRIDO':
        return 'badge badge--soft';
      case 'UTILIZADO':
        return 'badge badge--ok';
      case 'ANULADO':
        return 'badge badge--muted';
      default:
        return 'badge';
    }
  }

  trackById(_: number, item: VoucherClienteVm): number {
    return item.idVoucher;
  }
}