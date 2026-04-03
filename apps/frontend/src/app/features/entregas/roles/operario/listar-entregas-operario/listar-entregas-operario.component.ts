import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EntregaListItem,
  EntregasApi,
  EstadoEntregaCode,
  FilterEntrega,
} from '../../../../../api/entrega.api';
import { EntregaOperarioModalComponent } from '../ver-entrega-operario/entrega-operario-modal.component';

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

interface EstadoOption {
  value: '' | EstadoEntregaCode;
  label: string;
}

@Component({
  selector: 'app-listar-entregas-operario',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    DatePipe,
    DecimalPipe,
    EntregaOperarioModalComponent,
  ],
  templateUrl: './listar-entregas-operario.component.html',
  styleUrls: ['./listar-entregas-operario.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListarEntregasOperarioComponent {
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly entregas = signal<EntregaOperarioVm[]>([]);
  readonly total = signal(0);

  readonly modalVisible = signal(false);
  readonly entregaSeleccionada = signal<EntregaOperarioVm | null>(null);

  readonly q = signal('');
  readonly estado = signal<'' | EstadoEntregaCode>('');
  readonly idCliente = signal('');
  readonly idDesafio = signal('');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');

  readonly limit = signal(20);
  readonly offset = signal(0);

  readonly sortBy = signal<
    'idEntrega' | 'fechaCreacion' | 'fechaVencimiento' | 'fechaValidacion' | 'estado' | 'idCliente' | 'idDesafio'
  >('idEntrega');

  readonly order = signal<'asc' | 'desc'>('desc');

  readonly origen = signal<'pendientes' | 'completo'>('completo');

  readonly estados: EstadoOption[] = [
    { value: '', label: 'Todos los estados' },
    { value: 1, label: 'Creada' },
    { value: 2, label: 'Pendiente' },
    { value: 3, label: 'Validada' },
    { value: 4, label: 'Rechazada' },
    { value: 5, label: 'Puntos otorgados' },
    { value: 6, label: 'Anulada' },
  ];

  readonly totalPages = computed(() => {
    const pages = Math.ceil(this.total() / this.limit());
    return Math.max(1, pages);
  });

  readonly currentPage = computed(() => Math.floor(this.offset() / this.limit()) + 1);

  readonly subtitulo = computed(() => {
    return this.origen() === 'pendientes'
      ? 'Listado operativo filtrado automáticamente a entregas pendientes.'
      : 'Listado completo de entregas con filtros avanzados para revisión operativa.';
  });

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly entregasApi: EntregasApi,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.route.queryParamMap.subscribe((params) => {
      const estadoParam = params.get('estado');
      const origenParam = params.get('origen');

      if (estadoParam === '2') {
        this.estado.set(2);
        this.origen.set('pendientes');
      } else {
        this.estado.set('');
        this.origen.set('completo');
      }

      if (origenParam === 'dashboard-pendientes') {
        this.origen.set('pendientes');
      }

      this.offset.set(0);
      this.cargarEntregas();
    });
  }

  trackByEntrega = (_: number, item: EntregaOperarioVm) => item.idEntrega;

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

  aplicarFiltros(): void {
    this.offset.set(0);
    this.cargarEntregas();
  }

  limpiarFiltros(): void {
    this.q.set('');
    this.idCliente.set('');
    this.idDesafio.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.sortBy.set('idEntrega');
    this.order.set('desc');
    this.offset.set(0);

    if (this.origen() === 'pendientes') {
      this.estado.set(2);
    } else {
      this.estado.set('');
    }

    this.cargarEntregas();
  }

  changePage(delta: number): void {
    const nextPage = this.currentPage() + delta;
    if (nextPage < 1 || nextPage > this.totalPages()) return;

    this.offset.set((nextPage - 1) * this.limit());
    this.cargarEntregas();
  }

  onLimitChange(value: string): void {
    const next = Number(value);
    if (!Number.isFinite(next) || next <= 0) return;
    this.limit.set(next);
    this.offset.set(0);
    this.cargarEntregas();
  }

  openViewModal(entrega: EntregaOperarioVm): void {
    this.entregaSeleccionada.set(entrega);
    this.modalVisible.set(true);
  }

  openViewModalById(idEntrega: number): void {
    const entrega = this.entregas().find((e) => e.idEntrega === idEntrega);
    if (!entrega) return;
    this.openViewModal(entrega);
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
        this.entregaSeleccionada.set(this.toEntregaVm(updated));
        this.cargarEntregas();
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
        this.entregaSeleccionada.set(this.toEntregaVm(updated));
        this.cargarEntregas();
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
        this.entregaSeleccionada.set(this.toEntregaVm(updated));
        this.cargarEntregas();
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
        this.entregaSeleccionada.set(this.toEntregaVm(updated));
        this.cargarEntregas();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudieron confirmar los puntos.');
      },
    });
  }

  volverDashboard(): void {
    this.router.navigate(['/menu-principal/operario/entregas']);
  }

  private cargarEntregas(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    const filter: FilterEntrega = {
      limit: this.limit(),
      offset: this.offset(),
      sortBy: this.sortBy(),
      order: this.order(),
      estado: this.estado() || undefined,
      idCliente: this.idCliente().trim() ? Number(this.idCliente()) : undefined,
      idDesafio: this.idDesafio().trim() ? Number(this.idDesafio()) : undefined,
      fechaDesde: this.fechaDesde() || undefined,
      fechaHasta: this.fechaHasta() || undefined,
    };

    this.entregasApi.list(filter).subscribe({
      next: (res) => {
        let items = (res.items ?? []).map((e) => this.toEntregaVm(e));

        const q = this.q().trim().toLowerCase();
        if (q) {
          items = items.filter((e) =>
            String(e.idEntrega).includes(q) ||
            e.codigoVisible.toLowerCase().includes(q) ||
            e.clienteNombre.toLowerCase().includes(q) ||
            e.desafioTitulo.toLowerCase().includes(q) ||
            (e.ubicacion ?? '').toLowerCase().includes(q)
          );
        }

        this.entregas.set(items);
        this.total.set(res.total ?? items.length);
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

  getEstadoValue(): string {
    return this.estado() === '' ? '' : String(this.estado());
  }

  onEstadoChange(value: string): void {
    this.estado.set(value === '' ? '' : (Number(value) as EstadoEntregaCode));
  }

  getLimitValue(): string {
    return String(this.limit());
  }

  private toPlainText(value?: string | null): string {
    if (!value) return '';
    const div = document.createElement('div');
    div.innerHTML = value;
    return (div.textContent || div.innerText || '').trim();
  }
}