import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MovimientosApi, MovimientoPuntosItem } from '../../../../../api/movimientos.api';

type TipoMovimiento = 'CREDITO' | 'DEBITO';
type OrigenMovimiento = 'ENTREGA' | 'VOUCHER' | 'AJUSTE';

interface MovimientoClienteVm {
  idMovimiento: number;
  fecha: string;
  tipo: TipoMovimiento;
  origen: OrigenMovimiento;
  puntos: number;
  descripcion: string;
  referencia?: string;
}

@Component({
  standalone: true,
  selector: 'app-historial-movimientos-cliente',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historial-movimientos-cliente.component.html',
  styleUrls: ['./historial-movimientos-cliente.component.scss'],
})
export class HistorialMovimientosClienteComponent {
  private router = inject(Router);
  private movimientosApi = inject(MovimientosApi);

  loading = false;
  error: string | null = null;

  filtroOrigen = signal<'TODOS' | OrigenMovimiento>('TODOS');
  filtroTipo = signal<'TODOS' | TipoMovimiento>('TODOS');

  puntosActuales = 0;

  movimientos = signal<MovimientoClienteVm[]>([]);

  movimientosFiltrados = computed(() => {
    let items = [...this.movimientos()];

    if (this.filtroOrigen() !== 'TODOS') {
      items = items.filter(x => x.origen === this.filtroOrigen());
    }

    if (this.filtroTipo() !== 'TODOS') {
      items = items.filter(x => x.tipo === this.filtroTipo());
    }

    return items;
  });

  totalCreditos = computed(() =>
    this.movimientos()
      .filter(x => x.tipo === 'CREDITO')
      .reduce((acc, x) => acc + x.puntos, 0)
  );

  totalDebitos = computed(() =>
    this.movimientos()
      .filter(x => x.tipo === 'DEBITO')
      .reduce((acc, x) => acc + x.puntos, 0)
  );

  constructor() {
    this.cargarMovimientos();
  }

  cargarMovimientos(): void {
    this.loading = true;
    this.error = null;

    this.movimientosApi.list({
      limit: 100,
      offset: 0,
      sortBy: 'fecha',
      order: 'desc',
    }).subscribe({
      next: (resp) => {
        const items: MovimientoClienteVm[] = (resp?.items ?? []).map((item: MovimientoPuntosItem) => ({
          idMovimiento: item.idMovimiento,
          fecha: item.fecha,
          tipo: (item.tipo === 2 ? 'DEBITO' : 'CREDITO') as TipoMovimiento,
          origen: (
            item.origen === 1
              ? 'ENTREGA'
              : item.origen === 2
                ? 'VOUCHER'
                : 'AJUSTE'
          ) as OrigenMovimiento,
          puntos: Number(item.puntos ?? 0),
          descripcion: item.descripcion ?? '-',
          referencia:
            item.idEntrega ? `Entrega #${item.idEntrega}`
            : item.idVoucher ? `Voucher #${item.idVoucher}`
            : item.idAdmin ? `Admin #${item.idAdmin}`
            : '-',
        }));

        this.movimientos.set(items);
        this.puntosActuales = this.totalCreditos() - this.totalDebitos();
        this.loading = false;
      },
      error: (err) => {
        console.error('[HistorialMovimientosCliente] Error cargando movimientos', err);
        this.error = err?.error?.message ?? 'No se pudieron cargar los movimientos.';
        this.loading = false;
      }
    });
  }

  irAlDashboard(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers']);
  }

  verMisVouchers(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/mis-vouchers']);
  }

  getClaseTipo(tipo: TipoMovimiento): string {
    return tipo === 'CREDITO' ? 'badge badge--ok' : 'badge badge--warn';
  }

  getClasePuntos(tipo: TipoMovimiento): string {
    return tipo === 'CREDITO' ? 'points points--plus' : 'points points--minus';
  }

  trackById(_: number, item: MovimientoClienteVm): number {
    return item.idMovimiento;
  }
}