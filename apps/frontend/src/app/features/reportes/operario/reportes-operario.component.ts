import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import {
  EntregaListItem,
  EntregasApi,
  EstadoEntregaCode,
  FilterEntrega,
} from '../../../api/entrega.api';
import { EntregaOperarioModalComponent } from '../../entregas/roles/operario/ver-entrega-operario/entrega-operario-modal.component';

interface EntregaReporteVm {
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

interface DashboardKpi {
  label: string;
  value: number;
  helper: string;
  icon: string;
}

interface EstadoOption {
  value: '' | EstadoEntregaCode;
  label: string;
}

@Component({
  selector: 'app-reportes-operario',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    DatePipe,
    DecimalPipe,
    EntregaOperarioModalComponent,
  ],
  templateUrl: './reportes-operario.component.html',
  styleUrls: ['./reportes-operario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportesOperarioComponent {
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly items = signal<EntregaReporteVm[]>([]);
  readonly modalVisible = signal(false);
  readonly entregaSeleccionada = signal<EntregaReporteVm | null>(null);

  readonly q = signal('');
  readonly estado = signal<'' | EstadoEntregaCode>('');
  readonly idCliente = signal('');
  readonly idDesafio = signal('');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');
  readonly sortBy = signal<
    'idEntrega' | 'fechaCreacion' | 'fechaVencimiento' | 'fechaValidacion' | 'estado' | 'idCliente' | 'idDesafio'
  >('idEntrega');
  readonly order = signal<'asc' | 'desc'>('desc');

  readonly page = signal(1);
  readonly pageSize = signal(10);

  readonly estados: EstadoOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: 1, label: 'Creada' },
    { value: 2, label: 'Pendiente' },
    { value: 3, label: 'Validada' },
    { value: 4, label: 'Rechazada' },
    { value: 5, label: 'Puntos otorgados' },
    { value: 6, label: 'Anulada' },
  ];

  readonly filtradas = computed(() => {
    const q = this.q().trim().toLowerCase();

    let rows = [...this.items()];

    if (q) {
      rows = rows.filter((r) =>
        String(r.idEntrega).includes(q) ||
        r.codigoVisible.toLowerCase().includes(q) ||
        r.clienteNombre.toLowerCase().includes(q) ||
        r.desafioTitulo.toLowerCase().includes(q) ||
        (r.ubicacion ?? '').toLowerCase().includes(q)
      );
    }

    rows.sort((a, b) => {
      const field = this.sortBy();
      const direction = this.order() === 'asc' ? 1 : -1;

      const va = this.getSortableValue(a, field);
      const vb = this.getSortableValue(b, field);

      if (va < vb) return -1 * direction;
      if (va > vb) return 1 * direction;
      return 0;
    });

    return rows;
  });

  readonly totalReg = computed(() => this.filtradas().length);
  readonly cantPend = computed(() => this.filtradas().filter((r) => r.estado === 2).length);
  readonly cantVal = computed(() => this.filtradas().filter((r) => r.estado === 3).length);
  readonly cantRech = computed(() => this.filtradas().filter((r) => r.estado === 4).length);
  readonly cantPuntos = computed(() => this.filtradas().filter((r) => r.estado === 5).length);

  readonly totalCantidadDeclarada = computed(() =>
    this.filtradas().reduce((acc, r) => acc + Number(r.cantidadDeclarada ?? 0), 0)
  );

  readonly totalCantidadVerificada = computed(() =>
    this.filtradas().reduce((acc, r) => acc + Number(r.cantidadVerificada ?? 0), 0)
  );

  readonly compPendPct = computed(() => {
    const total = Math.max(1, this.totalReg());
    return (this.cantPend() / total) * 100;
  });

  readonly compValPct = computed(() => {
    const total = Math.max(1, this.totalReg());
    return (this.cantVal() / total) * 100;
  });

  readonly compRechPct = computed(() => {
    const total = Math.max(1, this.totalReg());
    return (this.cantRech() / total) * 100;
  });

  readonly compPuntosPct = computed(() => {
    const total = Math.max(1, this.totalReg());
    return (this.cantPuntos() / total) * 100;
  });

  readonly kpis = computed<DashboardKpi[]>(() => [
    {
      label: 'Registros',
      value: this.totalReg(),
      helper: 'Total filtrado',
      icon: 'inventory_2',
    },
    {
      label: 'Pendientes',
      value: this.cantPend(),
      helper: 'Listas para control',
      icon: 'hourglass_top',
    },
    {
      label: 'Validadas',
      value: this.cantVal(),
      helper: 'Aprobadas por operario',
      icon: 'task_alt',
    },
    {
      label: 'Rechazadas',
      value: this.cantRech(),
      helper: 'Observadas en control',
      icon: 'dangerous',
    },
    {
      label: 'Puntos otorgados',
      value: this.cantPuntos(),
      helper: 'Entregas cerradas',
      icon: 'workspace_premium',
    },
  ]);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.totalReg() / this.pageSize()))
  );

  readonly visibles = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtradas().slice(start, start + this.pageSize());
  });

  readonly cantCreadas = computed(() => this.filtradas().filter((r) => r.estado === 1).length);
  readonly cantAnuladas = computed(() => this.filtradas().filter((r) => r.estado === 6).length);

  readonly compCreadasPct = computed(() => {
    const total = Math.max(1, this.totalReg());
    return (this.cantCreadas() / total) * 100;
  });

  readonly compAnuladasPct = computed(() => {
    const total = Math.max(1, this.totalReg());
    return (this.cantAnuladas() / total) * 100;
  });

  readonly totalConValidacion = computed(() =>
    this.filtradas().filter((r) => !!r.fechaValidacion).length
  );

  readonly totalSinValidacion = computed(() =>
    this.filtradas().filter((r) => !r.fechaValidacion).length
  );

  readonly totalConMotivoRechazo = computed(() =>
    this.filtradas().filter((r) => !!(r.motivoRechazo && r.motivoRechazo.trim())).length
  );

  constructor(
    private readonly entregasApi: EntregasApi,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.cargarReportes();
  }

  trackByKpi = (_: number, item: DashboardKpi) => item.label;
  trackByEntrega = (_: number, item: EntregaReporteVm) => item.idEntrega;

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

  getEstadoValue(): string {
    return this.estado() === '' ? '' : String(this.estado());
  }

  onEstadoChange(value: string): void {
    this.estado.set(value === '' ? '' : (Number(value) as EstadoEntregaCode));
  }

  getPageSizeValue(): string {
    return String(this.pageSize());
  }

  onPageSizeChange(value: string): void {
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) return;
    this.pageSize.set(next);
    this.page.set(1);
  }

  aplicarFiltros(): void {
    this.page.set(1);
    this.cargarReportes();
  }

  limpiarFiltros(): void {
    this.q.set('');
    this.estado.set('');
    this.idCliente.set('');
    this.idDesafio.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.sortBy.set('idEntrega');
    this.order.set('desc');
    this.page.set(1);
    this.pageSize.set(10);
    this.cargarReportes();
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
  }

  openViewModal(entrega: EntregaReporteVm): void {
    this.entregaSeleccionada.set(entrega);
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
  }

  onValidarEntrega(entrega: EntregaReporteVm): void {
    this.entregasApi.revisarOperario(entrega.idEntrega, {
      accion: 'VALIDAR',
      cantidadVerificada: Number(entrega.cantidadDeclarada).toFixed(3),
      observaciones: entrega.observaciones || undefined,
    }).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarReportes();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo validar la entrega.');
      },
    });
  }

  onRechazarEntrega(payload: { entrega: EntregaReporteVm; motivo?: string }): void {
    this.entregasApi.revisarOperario(payload.entrega.idEntrega, {
      accion: 'RECHAZAR',
      cantidadVerificada: '0.000',
      observaciones: payload.entrega.observaciones || undefined,
      motivoRechazo: payload.motivo || 'Entrega rechazada por control operativo.',
    }).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarReportes();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo rechazar la entrega.');
      },
    });
  }

  onVolverPendiente(entrega: EntregaReporteVm): void {
    this.entregasApi.volverPendienteOperario(entrega.idEntrega, {}).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarReportes();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo volver la entrega a pendiente.');
      },
    });
  }

  onConfirmarPuntos(entrega: EntregaReporteVm): void {
    this.entregasApi.confirmarPuntosOperario(entrega.idEntrega, {}).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarReportes();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudieron confirmar los puntos.');
      },
    });
  }

  exportCSV(): void {
    const rows = [
      [
        'ID',
        'Código',
        'Cliente',
        'Desafío',
        'Cantidad declarada',
        'Cantidad verificada',
        'Fecha creación',
        'Fecha vencimiento',
        'Fecha validación',
        'Estado',
        'Ubicación',
        'Motivo rechazo',
      ],
      ...this.filtradas().map((r) => [
        r.idEntrega,
        r.codigoVisible,
        r.clienteNombre,
        r.desafioTitulo,
        `${r.cantidadDeclarada} ${r.unidadMedida}`,
        r.cantidadVerificada != null ? `${r.cantidadVerificada} ${r.unidadMedida}` : '',
        r.fechaCreacion,
        r.fechaVencimiento,
        r.fechaValidacion ?? '',
        this.getEstadoLabel(r.estado),
        r.ubicacion ?? '',
        r.motivoRechazo ?? '',
      ]),
    ];

    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reportes-operario_${this.fechaDesde() || 'inicio'}_${this.fechaHasta() || 'hoy'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private cargarReportes(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    const filter: FilterEntrega = {
      limit: 100,
      offset: 0,
      estado: this.estado() || undefined,
      idCliente: this.idCliente().trim() ? Number(this.idCliente()) : undefined,
      idDesafio: this.idDesafio().trim() ? Number(this.idDesafio()) : undefined,
      fechaDesde: this.fechaDesde() || undefined,
      fechaHasta: this.fechaHasta() || undefined,
      sortBy: this.sortBy(),
      order: this.order(),
    };

    this.entregasApi.list(filter).subscribe({
      next: (res) => {
        const rows = (res.items ?? []).map((e) => this.toVm(e));
        this.items.set(rows);
        this.page.set(1);
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg.set('No se pudieron cargar los reportes del operario.');
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  private toVm(item: EntregaListItem): EntregaReporteVm {
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

  private getSortableValue(
    item: EntregaReporteVm,
    field:
      | 'idEntrega'
      | 'fechaCreacion'
      | 'fechaVencimiento'
      | 'fechaValidacion'
      | 'estado'
      | 'idCliente'
      | 'idDesafio'
  ): string | number {
    switch (field) {
      case 'idEntrega':
        return item.idEntrega;
      case 'fechaCreacion':
        return new Date(item.fechaCreacion).getTime();
      case 'fechaVencimiento':
        return new Date(item.fechaVencimiento).getTime();
      case 'fechaValidacion':
        return item.fechaValidacion ? new Date(item.fechaValidacion).getTime() : 0;
      case 'estado':
        return item.estado;
      case 'idCliente':
        return item.idCliente;
      case 'idDesafio':
        return item.idDesafio;
      default:
        return item.idEntrega;
    }
  }

  private toPlainText(value?: string | null): string {
    if (!value) return '';
    const div = document.createElement('div');
    div.innerHTML = value;
    return (div.textContent || div.innerText || '').trim();
  }
}