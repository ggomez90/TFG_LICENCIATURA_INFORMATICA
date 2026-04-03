import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import {
  EntregaListItem,
  EntregasApi,
  EstadoEntregaCode,
  FilterEntrega,
} from '../../../../api/entrega.api';
import {
  EntregaOperarioModalComponent,
  EntregaOperarioModalVm,
} from '../operario/ver-entrega-operario/entrega-operario-modal.component';

interface EstadoOption {
  value: 'todos' | EstadoEntregaCode;
  label: string;
}

interface EntregaAdministradorVm extends EntregaOperarioModalVm {}

@Component({
  selector: 'app-entregas-administrador',
  standalone: true,
  imports: [
    CommonModule,
    NgClass,
    DatePipe,
    EntregaOperarioModalComponent,
  ],
  templateUrl: './entregas-administrador.component.html',
  styleUrls: ['./entregas-administrador.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregasAdministradorComponent {
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly entregas = signal<EntregaAdministradorVm[]>([]);

  readonly q = signal('');
  readonly estado = signal<'todos' | EstadoEntregaCode>('todos');
  readonly idCliente = signal('');
  readonly idDesafio = signal('');
  readonly fechaDesde = signal('');
  readonly fechaHasta = signal('');

  readonly busquedaRapida = signal('');

  readonly modalVisible = signal(false);
  readonly entregaSeleccionada = signal<EntregaAdministradorVm | null>(null);

  readonly page = signal(1);
  readonly pageSize = signal(20);

  readonly estados: EstadoOption[] = [
    { value: 'todos', label: 'Todos los estados' },
    { value: 1, label: 'Creada' },
    { value: 2, label: 'Pendiente' },
    { value: 3, label: 'Validada' },
    { value: 4, label: 'Rechazada' },
    { value: 5, label: 'Puntos otorgados' },
    { value: 6, label: 'Anulada' },
  ];

  readonly filtradas = computed(() => {
    const q = this.q().trim().toLowerCase();

    return [...this.entregas()]
      .filter((e) => {
        if (!q) return true;
        return (
          String(e.idEntrega).includes(q) ||
          e.codigoVisible.toLowerCase().includes(q) ||
          String(e.idCliente).includes(q) ||
          String(e.idDesafio).includes(q) ||
          e.clienteNombre.toLowerCase().includes(q) ||
          e.desafioTitulo.toLowerCase().includes(q) ||
          (e.ubicacion ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.idEntrega - a.idEntrega);
  });

  readonly totalEntregas = computed(() => this.filtradas().length);
  readonly totalCreadas = computed(() => this.filtradas().filter((e) => e.estado === 1).length);
  readonly totalPendientes = computed(() => this.filtradas().filter((e) => e.estado === 2).length);
  readonly totalValidadas = computed(() => this.filtradas().filter((e) => e.estado === 3).length);
  readonly totalRechazadas = computed(() => this.filtradas().filter((e) => e.estado === 4).length);
  readonly totalPuntos = computed(() => this.filtradas().filter((e) => e.estado === 5).length);
  readonly totalAnuladas = computed(() => this.filtradas().filter((e) => e.estado === 6).length);

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filtradas().length / this.pageSize()))
  );

  readonly visibles = computed(() => {
    const start = (this.page() - 1) * this.pageSize();
    return this.filtradas().slice(start, start + this.pageSize());
  });

  constructor(
    private readonly entregasApi: EntregasApi,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.cargarEntregas();
  }

  trackByEntrega = (_: number, item: EntregaAdministradorVm) => item.idEntrega;

  getEstadoValue(): string {
    return this.estado() === 'todos' ? 'todos' : String(this.estado());
  }

  onEstadoChange(value: string): void {
    if (value === 'todos') {
      this.estado.set('todos');
      return;
    }
    this.estado.set(Number(value) as EstadoEntregaCode);
  }

  aplicarFiltros(): void {
    this.page.set(1);
    this.cargarEntregas();
  }

  limpiarFiltros(): void {
    this.q.set('');
    this.estado.set('todos');
    this.idCliente.set('');
    this.idDesafio.set('');
    this.fechaDesde.set('');
    this.fechaHasta.set('');
    this.page.set(1);
    this.cargarEntregas();
  }

  verEntrega(item: EntregaAdministradorVm): void {
    this.entregaSeleccionada.set(item);
    this.modalVisible.set(true);
  }

  cerrarModal(): void {
    this.modalVisible.set(false);
  }

  buscarEntregaRapida(): void {
    const raw = this.busquedaRapida().trim();
    if (!raw) {
      alert('Ingresa un ID o código de entrega.');
      return;
    }

    const normalizado = raw.toLowerCase();
    const idNumerico = Number(raw.replace(/[^\d]/g, ''));

    const encontrada = this.entregas().find((e) => {
      return (
        e.codigoVisible.toLowerCase() === normalizado ||
        String(e.idEntrega) === raw ||
        (!Number.isNaN(idNumerico) && e.idEntrega === idNumerico)
      );
    });

    if (!encontrada) {
      alert('No se encontró una entrega con ese ID o código dentro del conjunto cargado.');
      return;
    }

    this.verEntrega(encontrada);
  }

  prevPage(): void {
    if (this.page() <= 1) return;
    this.page.update((p) => p - 1);
  }

  nextPage(): void {
    if (this.page() >= this.totalPages()) return;
    this.page.update((p) => p + 1);
  }

  onValidarEntrega(entrega: EntregaAdministradorVm): void {
    this.entregasApi.revisarOperario(entrega.idEntrega, {
      accion: 'VALIDAR',
      cantidadVerificada: Number(entrega.cantidadDeclarada).toFixed(3),
      observaciones: entrega.observaciones || undefined,
    }).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarEntregas();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo validar la entrega.');
      },
    });
  }

  onRechazarEntrega(payload: { entrega: EntregaAdministradorVm; motivo?: string }): void {
    this.entregasApi.revisarOperario(payload.entrega.idEntrega, {
      accion: 'RECHAZAR',
      cantidadVerificada: '0.000',
      observaciones: payload.entrega.observaciones || undefined,
      motivoRechazo: payload.motivo || 'Entrega rechazada por control administrativo.',
    }).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarEntregas();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo rechazar la entrega.');
      },
    });
  }

  onVolverPendiente(entrega: EntregaAdministradorVm): void {
    this.entregasApi.volverPendienteOperario(entrega.idEntrega, {}).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarEntregas();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo volver la entrega a pendiente.');
      },
    });
  }

  onConfirmarPuntos(entrega: EntregaAdministradorVm): void {
    this.entregasApi.confirmarPuntosOperario(entrega.idEntrega, {}).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarEntregas();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudieron confirmar los puntos.');
      },
    });
  }

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
      1: 'pill--muted',
      2: 'pill--warn',
      3: 'pill--ok',
      4: 'pill--danger',
      5: 'pill--base',
      6: 'pill--muted',
    };
    return map[estado];
  }

  private cargarEntregas(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    const estadoFiltro: EstadoEntregaCode | undefined =
      this.estado() === 'todos'
        ? undefined
        : (this.estado() as EstadoEntregaCode);

    const filter: FilterEntrega = {
      limit: 100,
      offset: 0,
      estado: estadoFiltro,
      idCliente: this.idCliente().trim() ? Number(this.idCliente()) : undefined,
      idDesafio: this.idDesafio().trim() ? Number(this.idDesafio()) : undefined,
      fechaDesde: this.fechaDesde() || undefined,
      fechaHasta: this.fechaHasta() || undefined,
      sortBy: 'idEntrega',
      order: 'desc',
    };

    this.entregasApi.list(filter).subscribe({
      next: (res) => {
        const rows = (res.items ?? []).map((e) => this.toVm(e));
        this.entregas.set(rows);
        this.page.set(1);
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg.set('No se pudieron cargar las entregas del administrador.');
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  private toVm(item: EntregaListItem): EntregaAdministradorVm {
    return {
      idEntrega: item.idEntrega,
      idCliente: item.idCliente,
      clienteNombre: `Cliente #${item.idCliente}`,
      idDesafio: item.idDesafio,
      desafioTitulo: this.toPlainText(item.desafio?.titulo) || `Desafío #${item.idDesafio}`,
      tipoResiduo: item.desafio?.tipoResiduo ?? 'Residuo',
      unidadMedida: item.desafio?.unidadMedida ?? 'Unidad',
      cantidadDeclarada: Number(item.cantidadDeclarada ?? 0),
      cantidadVerificada:
        item.cantidadVerificada == null ? null : Number(item.cantidadVerificada),
      fechaCreacion: item.fechaCreacion,
      fechaVencimiento: item.fechaVencimiento,
      fechaValidacion: item.fechaValidacion ?? null,
      estado: item.estado,
      observaciones: item.observaciones ?? '',
      ubicacion: item.ubicacion ?? 'CORRALÓN MUNICIPAL',
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

  private toPlainText(value?: string | null): string {
    if (!value) return '';
    const div = document.createElement('div');
    div.innerHTML = value;
    return (div.textContent || div.innerText || '').trim();
  }
}