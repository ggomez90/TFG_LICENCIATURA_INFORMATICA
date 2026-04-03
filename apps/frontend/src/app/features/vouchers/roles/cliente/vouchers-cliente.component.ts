import { CommonModule } from '@angular/common';
import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ClienteVoucherTipoItem,
  VoucherTipoApi,
} from '../../../../api/voucher-tipo.api';
import {
  VoucherApi,
  VoucherListItem,
} from '../../../../api/voucher.api';
import {
  MovimientosApi,
  MovimientoPuntosItem,
} from '../../../../api/movimientos.api';

type EstadoDisponibilidad = 'disponible' | 'faltan-puntos';

interface VoucherTipoDestacadoVm {
  idVoucherTipo: number;
  titulo: string;
  descripcion: string;
  montoBeneficio: number;
  puntosRequeridos: number;
  vigenciaTexto: string;
  estado: EstadoDisponibilidad;
  puntosFaltantes?: number;
}

interface VoucherResumenVm {
  idVoucher: number;
  codigo: string;
  tipoTitulo: string;
  estado: 'ADQUIRIDO' | 'UTILIZADO' | 'ANULADO';
  fechaAdquisicion: string;
}

interface MovimientoResumenVm {
  idMovimiento: number;
  fecha: string;
  origen: 'ENTREGA' | 'VOUCHER' | 'AJUSTE';
  tipo: 'CREDITO' | 'DEBITO';
  puntos: number;
  descripcion: string;
}

@Component({
  standalone: true,
  selector: 'app-voucher-cliente',
  imports: [CommonModule, RouterModule],
  templateUrl: './vouchers-cliente.component.html',
  styleUrls: ['./vouchers-cliente.component.scss'],
})
export class VoucherClienteComponent {
  private router = inject(Router);
  private voucherTipoApi = inject(VoucherTipoApi);
  private voucherApi = inject(VoucherApi);
  private movimientosApi = inject(MovimientosApi);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;

  puntosDisponibles = 0;

  kpis = {
    vouchersAdquiridos: 0,
    vouchersUtilizados: 0,
    vouchersAnulados: 0,
  };

  voucherRecomendado: VoucherTipoDestacadoVm | null = null;
  vouchersDestacados = signal<VoucherTipoDestacadoVm[]>([]);
  ultimosVouchers = signal<VoucherResumenVm[]>([]);
  ultimosMovimientos = signal<MovimientoResumenVm[]>([]);

  constructor() {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      tiposDisponibles: this.voucherTipoApi.getDisponiblesCliente({
        limit: 12,
        offset: 0,
        sortBy: 'puntosRequeridos',
        order: 'asc',
      }),
      vouchers: this.voucherApi.list({
        limit: 20,
        offset: 0,
        sortBy: 'fechaAdquisicion',
        order: 'desc',
      }),
      movimientos: this.movimientosApi.list({
        limit: 20,
        offset: 0,
        sortBy: 'fecha',
        order: 'desc',
      }),
    }).subscribe({
      next: ({ tiposDisponibles, vouchers, movimientos }) => {
        this.puntosDisponibles = Number(tiposDisponibles?.puntosDisponibles ?? 0);

        const tiposVm: VoucherTipoDestacadoVm[] = (tiposDisponibles?.items ?? []).map(
          (item: ClienteVoucherTipoItem) => ({
            idVoucherTipo: item.idVoucherTipo,
            titulo: item.titulo,
            descripcion: item.descripcion,
            montoBeneficio: Number(item.montoBeneficio ?? 0),
            puntosRequeridos: Number(item.puntosRequeridos ?? 0),
            vigenciaTexto: `Vigente hasta ${this.formatearFecha(item.fechaFinVigencia)}`,
            estado: (item.disponibleParaCanje ? 'disponible' : 'faltan-puntos') as EstadoDisponibilidad,
            puntosFaltantes: Number(item.puntosFaltantes ?? 0),
          })
        );

        this.voucherRecomendado =
          tiposVm.find(x => x.estado === 'disponible') ??
          tiposVm[0] ??
          null;

        this.vouchersDestacados.set(tiposVm.slice(0, 4));

        const vouchersVm: VoucherResumenVm[] = (vouchers?.items ?? []).map(
          (item: VoucherListItem) => ({
            idVoucher: item.idVoucher,
            codigo: String(item.idVoucher),
            tipoTitulo: item.voucherTipo?.titulo ?? `Tipo #${item.idVoucherTipo}`,
            estado: (
              item.estadoVoucher === 3
                ? 'UTILIZADO'
                : item.estadoVoucher === 4
                  ? 'ANULADO'
                  : 'ADQUIRIDO'
            ) as 'ADQUIRIDO' | 'UTILIZADO' | 'ANULADO',
            fechaAdquisicion: item.fechaAdquisicion,
          })
        );

        this.ultimosVouchers.set(vouchersVm.slice(0, 5));

        this.kpis = {
          vouchersAdquiridos: vouchersVm.filter(v => v.estado === 'ADQUIRIDO').length,
          vouchersUtilizados: vouchersVm.filter(v => v.estado === 'UTILIZADO').length,
          vouchersAnulados: vouchersVm.filter(v => v.estado === 'ANULADO').length,
        };

        const movimientosVm: MovimientoResumenVm[] = (movimientos?.items ?? []).map(
          (item: MovimientoPuntosItem) => ({
            idMovimiento: item.idMovimiento,
            fecha: item.fecha,
            origen: (
              item.origen === 1
                ? 'ENTREGA'
                : item.origen === 2
                  ? 'VOUCHER'
                  : 'AJUSTE'
            ) as 'ENTREGA' | 'VOUCHER' | 'AJUSTE',
            tipo: (item.tipo === 2 ? 'DEBITO' : 'CREDITO') as 'CREDITO' | 'DEBITO',
            puntos: Number(item.puntos ?? 0),
            descripcion: item.descripcion ?? '-',
          })
        );

        this.ultimosMovimientos.set(movimientosVm.slice(0, 5));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[VoucherClienteDashboard] Error cargando dashboard', err);
        this.error = err?.error?.message ?? 'No se pudo cargar la información del dashboard.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  irATiposDisponibles(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/disponibles']);
  }

  irAMisVouchers(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/mis-vouchers']);
  }

  irAHistorial(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/historial-movimientos']);
  }

  verVoucher(idVoucher: number): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/ver', idVoucher]);
  }

  adquirirVoucherTipo(idVoucherTipo: number): void {
    this.voucherApi.adquirirCliente({ idVoucherTipo }).subscribe({
      next: () => {
        this.cargarDashboard();
        this.irAMisVouchers();
      },
      error: (err) => {
        console.error('[VoucherClienteDashboard] Error adquiriendo voucher', err);
        this.error = err?.error?.message ?? 'No se pudo adquirir el voucher.';
      },
    });
  }

  getEstadoLabel(estado: EstadoDisponibilidad): string {
    switch (estado) {
      case 'disponible':
        return 'Disponible';
      case 'faltan-puntos':
        return 'No alcanzan tus puntos';
      default:
        return 'Desconocido';
    }
  }

  getEstadoClase(estado: EstadoDisponibilidad): string {
    switch (estado) {
      case 'disponible':
        return 'chip chip--ok';
      case 'faltan-puntos':
        return 'chip chip--warn';
      default:
        return 'chip';
    }
  }

  getClaseEstadoVoucher(estado: VoucherResumenVm['estado']): string {
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

  getClaseMovimiento(tipo: MovimientoResumenVm['tipo']): string {
    return tipo === 'CREDITO' ? 'points points--plus' : 'points points--minus';
  }

  trackByVoucherTipo(_: number, item: VoucherTipoDestacadoVm): number {
    return item.idVoucherTipo;
  }

  trackByVoucher(_: number, item: VoucherResumenVm): number {
    return item.idVoucher;
  }

  trackByMovimiento(_: number, item: MovimientoResumenVm): number {
    return item.idMovimiento;
  }

  private formatearFecha(value: string | Date | null | undefined): string {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-AR');
  }
}