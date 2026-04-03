import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import {
  EntregaListItem,
  EntregasApi,
} from '../../../../api/entrega.api';
import { EntregaOperarioModalComponent } from './ver-entrega-operario/entrega-operario-modal.component';

type EstadoEntregaCode = 1 | 2 | 3 | 4 | 5 | 6;

interface DashboardKpi {
  label: string;
  value: number;
  helper: string;
  icon: string;
}

interface EntregaOperarioVm {
  idEntrega: number;
  idCliente: number;
  clienteNombre: string;
  idDesafio: number;
  desafioTitulo: string;
  tipoResiduo: string;
  unidadMedida: string;
  cantidadDeclarada: number;
  cantidadVerificada?: number | null;
  fechaCreacion: string;
  fechaVencimiento: string;
  fechaValidacion?: string | null;
  estado: EstadoEntregaCode;
  observaciones?: string;
  ubicacion?: string;
  motivoRechazo?: string | null;
  codigoVisible: string;
  operarioNombre?: string | null;
  puntosEstimados?: number;
}

interface ActividadRecienteVm {
  idEntrega: number;
  codigoVisible: string;
  clienteNombre: string;
  desafioTitulo: string;
  fecha: string;
  estado: EstadoEntregaCode;
  detalle: string;
}

@Component({
  selector: 'app-entregas-operario',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    DatePipe,
    DecimalPipe,
    EntregaOperarioModalComponent,
  ],
  templateUrl: './entregas-operario.component.html',
  styleUrls: ['./entregas-operario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregasOperarioComponent {
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly busquedaRapida = signal('');
  readonly modalVisible = signal(false);
  readonly entregaSeleccionada = signal<EntregaOperarioVm | null>(null);

  readonly entregas = signal<EntregaOperarioVm[]>([]);

  readonly entregasPendientes = computed(() =>
    this.entregas()
      .filter((e) => e.estado === 2)
      .sort((a, b) => b.idEntrega - a.idEntrega)
  );

  readonly actividadReciente = computed<ActividadRecienteVm[]>(() =>
    [...this.entregas()]
      .sort((a, b) => b.idEntrega - a.idEntrega)
      .slice(0, 10)
      .map((e) => ({
        idEntrega: e.idEntrega,
        codigoVisible: e.codigoVisible,
        clienteNombre: e.clienteNombre,
        desafioTitulo: e.desafioTitulo,
        fecha: e.fechaValidacion || e.fechaCreacion,
        estado: e.estado,
        detalle:
          e.estado === 2
            ? 'Pendiente de control operativo'
            : e.estado === 3
              ? 'Validada por operario'
              : e.estado === 4
                ? 'Rechazada por control'
                : e.estado === 5
                  ? 'Confirmada para otorgar puntos'
                  : e.estado === 1
                    ? 'Entrega creada'
                    : e.estado === 6
                      ? 'Entrega anulada'
                      : 'Movimiento registrado',
      }))
  );

  readonly kpis = computed<DashboardKpi[]>(() => {
    const items = this.entregas();

    return [
      {
        label: 'Pendientes',
        value: items.filter((x) => x.estado === 2).length,
        helper: 'Entregas listas para control operativo',
        icon: 'hourglass_top',
      },
      {
        label: 'Validadas hoy',
        value: items.filter((x) => this.esHoy(x.fechaValidacion) && x.estado === 3).length,
        helper: 'Validadas hoy por el operario actual',
        icon: 'task_alt',
      },
      {
        label: 'Rechazadas hoy',
        value: items.filter((x) => this.esHoy(x.fechaValidacion) && x.estado === 4).length,
        helper: 'Rechazadas hoy por el operario actual',
        icon: 'dangerous',
      },
      {
        label: 'Puntos otorgados hoy',
        value: items.filter((x) => this.esHoy(x.fechaValidacion) && x.estado === 5).length,
        helper: 'Entregas confirmadas para acreditar puntos',
        icon: 'workspace_premium',
      },
    ];
  });

  constructor(
    private readonly router: Router,
    private readonly entregasApi: EntregasApi,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.cargarDashboard();
  }

  trackByKpi = (_: number, item: DashboardKpi) => item.label;
  trackByEntrega = (_: number, item: EntregaOperarioVm) => item.idEntrega;
  trackByActividad = (_: number, item: ActividadRecienteVm) => item.idEntrega;

  getEstadoLabel(estado: EstadoEntregaCode): string {
    const map: Record<EstadoEntregaCode, string> = {
      1: 'Creada',
      2: 'Pendiente',
      3: 'Validada',
      4: 'Rechazada',
      5: 'Puntos otorgados',
      6: 'Anulada',
    };
    return map[estado];
  }

  getEstadoClass(estado: EstadoEntregaCode): string {
    const map: Record<EstadoEntregaCode, string> = {
      1: 'is-creada',
      2: 'is-pendiente',
      3: 'is-validada',
      4: 'is-rechazada',
      5: 'is-puntos',
      6: 'is-anulada',
    };
    return map[estado];
  }

  buscarEntrega(): void {
    const raw = this.busquedaRapida().trim();
    if (!raw) return;

    const normalized = raw.toUpperCase().replace('ENT-', '').trim();
    const id = Number(normalized);

    const found = this.entregas().find(
      (e) => e.idEntrega === id || e.codigoVisible.toUpperCase() === raw.toUpperCase()
    );

    if (!found) {
      alert('No se encontró una entrega con ese ID/código.');
      return;
    }

    this.entregaSeleccionada.set(found);
    this.modalVisible.set(true);
  }

  openViewModal(entrega: EntregaOperarioVm): void {
    this.entregaSeleccionada.set(entrega);
    this.modalVisible.set(true);
  }

  openViewModalById(idEntrega: number): void {
    const entrega = this.entregas().find((e) => e.idEntrega === idEntrega);
    if (!entrega) return;

    this.entregaSeleccionada.set(entrega);
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
  }

  onValidarEntrega(entrega: EntregaOperarioVm): void {
    this.entregasApi.revisarOperario(entrega.idEntrega, {
      accion: 'VALIDAR',
      cantidadVerificada: Number(entrega.cantidadDeclarada).toFixed(3),
      observaciones: entrega.observaciones || undefined,
    }).subscribe({
      next: (updated) => {
        this.cargarDashboard();
        this.entregaSeleccionada.set(this.toEntregaVm(updated));
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo validar la entrega.');
      },
    });
  }

  onRechazarEntrega(payload: { entrega: EntregaOperarioVm; motivo?: string }): void {
    this.entregasApi.revisarOperario(payload.entrega.idEntrega, {
      accion: 'RECHAZAR',
      cantidadVerificada: '0.000',
      observaciones: payload.entrega.observaciones || undefined,
      motivoRechazo: payload.motivo || 'Entrega rechazada por control operativo.',
    }).subscribe({
      next: (updated) => {
        this.cargarDashboard();
        this.entregaSeleccionada.set(this.toEntregaVm(updated));
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo rechazar la entrega.');
      },
    });
  }

  onVolverPendiente(entrega: EntregaOperarioVm): void {
    this.entregasApi.volverPendienteOperario(entrega.idEntrega, {}).subscribe({
      next: (updated) => {
        this.cargarDashboard();
        this.entregaSeleccionada.set(this.toEntregaVm(updated));
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo volver la entrega a pendiente.');
      },
    });
  }

  onConfirmarPuntos(entrega: EntregaOperarioVm): void {
    this.entregasApi.confirmarPuntosOperario(entrega.idEntrega, {}).subscribe({
      next: (updated) => {
        this.cargarDashboard();
        this.entregaSeleccionada.set(this.toEntregaVm(updated));
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudieron confirmar los puntos.');
      },
    });
  }

  goToListadoCompleto(): void {
    this.router.navigate(['/menu-principal/operario/entregas/listado'], {
      queryParams: { origen: 'dashboard-completo' },
    });
  }

  goToListadoPendientes(): void {
    this.router.navigate(['/menu-principal/operario/entregas/listado'], {
      queryParams: { estado: 2, origen: 'dashboard-pendientes' },
    });
  }

  private cargarDashboard(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    this.entregasApi.list({
      limit: 100,
      offset: 0,
      sortBy: 'idEntrega',
      order: 'desc',
    }).subscribe({
      next: (res) => {
        const items = (res.items ?? []).map((e) => this.toEntregaVm(e));
        this.entregas.set(items);
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg.set('No se pudieron cargar las entregas del operario.');
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  private toEntregaVm(item: EntregaListItem): EntregaOperarioVm {
    return {
      idEntrega: item.idEntrega,
      idCliente: item.idCliente,
      clienteNombre: `Cliente #${item.idCliente}`,
      idDesafio: item.idDesafio,
      desafioTitulo: this.toPlainText(item.desafio?.titulo) || `Desafío #${item.idDesafio}`,
      tipoResiduo: item.desafio?.tipoResiduo ?? 'Residuo',
      unidadMedida: item.desafio?.unidadMedida ?? 'Unidad de medida desconocida',
      cantidadDeclarada: Number(item.cantidadDeclarada ?? 0),
      cantidadVerificada:
        item.cantidadVerificada == null ? null : Number(item.cantidadVerificada),
      fechaCreacion: item.fechaCreacion,
      fechaVencimiento: item.fechaVencimiento,
      fechaValidacion: item.fechaValidacion ?? null,
      estado: item.estado,
      observaciones: item.observaciones ?? '',
      ubicacion: item.ubicacion ?? 'CORRALON MUNICIPAL',
      motivoRechazo: item.motivoRechazo ?? null,
      codigoVisible: `ENT-${item.idEntrega}`,
      operarioNombre: item.idOperarioValidador
        ? `Operario #${item.idOperarioValidador}`
        : null,
      puntosEstimados: Math.round(
        Number(item.cantidadDeclarada ?? 0) *
        Number(item.desafio?.puntosPorUnidad ?? 0)
      ),
    };
  }

  private esHoy(fecha?: string | null): boolean {
    if (!fecha) return false;

    const f = new Date(fecha);
    const hoy = new Date();

    return (
      f.getFullYear() === hoy.getFullYear() &&
      f.getMonth() === hoy.getMonth() &&
      f.getDate() === hoy.getDate()
    );
  }

  private toPlainText(value?: string | null): string {
    if (!value) return '';
    const div = document.createElement('div');
    div.innerHTML = value;
    return (div.textContent || div.innerText || '').trim();
  }
  }