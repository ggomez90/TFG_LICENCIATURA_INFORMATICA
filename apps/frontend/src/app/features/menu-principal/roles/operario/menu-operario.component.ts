import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  EntregaListItem,
  EntregasApi,
  EstadoEntregaCode,
} from '../../../../api/entrega.api';

interface QuickLink {
  title: string;
  desc: string;
  route: string;
  icon: string;
}

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

@Component({
  selector: 'app-menu-operario',
  standalone: true,
  imports: [CommonModule, RouterModule, NgClass, DatePipe, DecimalPipe],
  templateUrl: './menu-operario.component.html',
  styleUrls: ['./menu-operario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuOperarioComponent {
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly entregas = signal<EntregaOperarioVm[]>([]);

  readonly links = signal<QuickLink[]>([
    {
      title: 'Entregas pendientes',
      desc: 'Ingresá al módulo operativo para revisar, validar o rechazar entregas.',
      route: '/menu-principal/operario/entregas',
      icon: 'fact_check',
    },
    {
      title: 'Listado completo',
      desc: 'Consultá todas las entregas con filtros avanzados por estado, cliente y fechas.',
      route: '/menu-principal/operario/entregas/listado',
      icon: 'table_view',
    },
    {
      title: 'Reportes operativos',
      desc: 'Visualizá métricas, composición por estado y exportación CSV.',
      route: '/menu-principal/operario/reportes',
      icon: 'monitoring',
    },
  ]);

  readonly pendientes = computed(() =>
    [...this.entregas()]
      .filter((e) => e.estado === 2)
      .sort((a, b) => b.idEntrega - a.idEntrega)
  );

  readonly recientesProcesadas = computed(() =>
    [...this.entregas()]
      .filter((e) => e.estado === 3 || e.estado === 4 || e.estado === 5)
      .sort((a, b) => b.idEntrega - a.idEntrega)
      .slice(0, 5)
  );

  readonly resumenEstados = computed(() => [
    {
      label: 'Creadas',
      value: this.entregas().filter((e) => e.estado === 1).length,
      className: 'is-creada',
    },
    {
      label: 'Pendientes',
      value: this.entregas().filter((e) => e.estado === 2).length,
      className: 'is-pendiente',
    },
    {
      label: 'Validadas',
      value: this.entregas().filter((e) => e.estado === 3).length,
      className: 'is-validada',
    },
    {
      label: 'Rechazadas',
      value: this.entregas().filter((e) => e.estado === 4).length,
      className: 'is-rechazada',
    },
    {
      label: 'Puntos otorgados',
      value: this.entregas().filter((e) => e.estado === 5).length,
      className: 'is-puntos',
    },
    {
      label: 'Anuladas',
      value: this.entregas().filter((e) => e.estado === 6).length,
      className: 'is-anulada',
    },
  ]);

  readonly kpis = computed<DashboardKpi[]>(() => {
    const rows = this.entregas();

    return [
      {
        label: 'Pendientes',
        value: rows.filter((x) => x.estado === 2).length,
        helper: 'Listas para revisión',
        icon: 'hourglass_top',
      },
      {
        label: 'Validadas hoy',
        value: rows.filter((x) => this.esHoy(x.fechaValidacion) && x.estado === 3).length,
        helper: 'Control operativo del día',
        icon: 'task_alt',
      },
      {
        label: 'Rechazadas hoy',
        value: rows.filter((x) => this.esHoy(x.fechaValidacion) && x.estado === 4).length,
        helper: 'Observadas en control',
        icon: 'dangerous',
      },
      {
        label: 'Puntos otorgados hoy',
        value: rows.filter((x) => this.esHoy(x.fechaValidacion) && x.estado === 5).length,
        helper: 'Entregas finalizadas',
        icon: 'workspace_premium',
      },
      {
        label: 'Cantidad pendiente',
        value: Math.round(
          rows
            .filter((x) => x.estado === 2)
            .reduce((acc, x) => acc + Number(x.cantidadDeclarada ?? 0), 0)
        ),
        helper: 'Volumen a revisar',
        icon: 'scale',
      },
    ];
  });

  readonly heroPendientes = computed(() => this.pendientes().length);
  readonly heroProcesadas = computed(
    () => this.entregas().filter((e) => e.estado === 3 || e.estado === 4 || e.estado === 5).length
  );

  constructor(
    private readonly entregasApi: EntregasApi,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.cargarDashboard();
  }

  trackByKpi = (_: number, item: DashboardKpi) => item.label;
  trackByEntrega = (_: number, item: EntregaOperarioVm) => item.idEntrega;
  trackByLink = (_: number, item: QuickLink) => item.route;

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
        const rows = (res.items ?? []).map((e) => this.toVm(e));
        this.entregas.set(rows);
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg.set('No se pudo cargar el inicio del operario.');
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  private toVm(item: EntregaListItem): EntregaOperarioVm {
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