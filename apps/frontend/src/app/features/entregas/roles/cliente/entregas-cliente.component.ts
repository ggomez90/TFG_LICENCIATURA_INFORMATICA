import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';


import { EntregaClienteModalComponent } from './ver-entregas-cliente/entrega-cliente-modal.component';
import { EntregaCreadaSuccessModalComponent } from './ver-entregas-cliente/entrega-creada-success-modal.component';
import { DesafioApi, DesafioItem } from '../../../../api/desafio.api';
import {
  InscripcionApi,
  InscripcionDesafioItem,
} from '../../../../api/inscripcion.api';
import {
  CreateEntregaDto,
  EntregaListItem,
  EntregasApi,
} from '../../../../api/entrega.api';

type EstadoEntregaCode = 1 | 2 | 3 | 4 | 5 | 6;

interface DashboardKpi {
  label: string;
  value: number;
  helper: string;
  icon: string;
}

interface DesafioEntregableVm {
  idDesafio: number;
  idInscripcionDesafio: number;
  titulo: string;
  tipoResiduo: string;
  unidadMedida: string;
  meta: number;
  fechaFin: string | null;
  progresoActual: number;
  progresoComprometido: number;
  progresoTotalProyectado: number;
  puntosAcumulados: number;
  estadoDesafio: 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
  disponibleParaEntrega: boolean;
  motivoBloqueo?: string | null;
  destacado?: boolean;
  puntosPorUnidad?: number | null;
  fechaAdhesion: string;
}

interface EntregaVm {
  idEntrega: number;
  idCliente: number;
  idDesafio: number;
  idInscripcionDesafio: number;
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
  puntosEstimados?: number;
}

const ESTADO_DESAFIO_ACTIVO = 1;
const ESTADO_DESAFIO_PAUSADO = 2;
const ESTADO_DESAFIO_FINALIZADO = 3;

@Component({
  selector: 'app-entregas-cliente',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgClass,
    DatePipe,
    DecimalPipe,
    EntregaClienteModalComponent,
    EntregaCreadaSuccessModalComponent,
  ],
  templateUrl: './entregas-cliente.component.html',
  styleUrls: ['./entregas-cliente.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregasClienteComponent {
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly desafiosEntregables = signal<DesafioEntregableVm[]>([]);
  readonly entregas = signal<EntregaVm[]>([]);

  readonly modalVisible = signal(false);
  readonly modalMode = signal<'view' | 'create' | 'edit'>('view');
  readonly entregaSeleccionada = signal<EntregaVm | null>(null);
  readonly desafioSeleccionado = signal<DesafioEntregableVm | null>(null);

  //MODEL SUCESS
  readonly successModalVisible = signal(false);
  readonly successCodigo = signal('');
  readonly successDesafioTitulo = signal('');
  readonly successCantidad = signal(0);
  readonly successUnidadMedida = signal('');

  readonly desafioDestacado = computed(
    () => this.desafiosEntregables().find((d) => d.destacado) ?? this.desafiosEntregables()[0] ?? null
  );

  readonly desafiosAccionPrincipal = computed(() => this.desafiosEntregables().slice(0, 3));

  readonly entregasBorrador = computed(() =>
    this.entregas()
      .filter((e) => e.estado === 1)
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 2)
  );

  readonly historialReciente = computed(() =>
    [...this.entregas()]
      .sort((a, b) => new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime())
      .slice(0, 5)
  );

  readonly kpis = computed<DashboardKpi[]>(() => {
    const items = this.entregas();

    return [
      {
        label: 'Total de entregas',
        value: items.length,
        helper: 'Historial general',
        icon: 'inventory_2',
      },
      {
        label: 'En borrador',
        value: items.filter((x) => x.estado === 1).length,
        helper: 'Listas para confirmar',
        icon: 'edit_note',
      },
      {
        label: 'Pendientes',
        value: items.filter((x) => x.estado === 2).length,
        helper: 'Esperando validar',
        icon: 'hourglass_top',
      },
      {
        label: 'Validadas / con puntos',
        value: items.filter((x) => x.estado === 3 || x.estado === 5).length,
        helper: 'Aceptadas por operación',
        icon: 'workspace_premium',
      },
      {
        label: 'Rechazadas',
        value: items.filter((x) => x.estado === 4).length,
        helper: 'Entregas observadas',
        icon: 'rule',
      },
    ];
  });

  constructor(
    private readonly router: Router,
    private readonly desafioApi: DesafioApi,
    private readonly inscripcionApi: InscripcionApi,
    private readonly entregasApi: EntregasApi,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.cargarDashboard();
  }

  trackByKpi = (_: number, item: DashboardKpi) => item.label;
  trackByDesafio = (_: number, item: DesafioEntregableVm) => item.idInscripcionDesafio;
  trackByEntrega = (_: number, item: EntregaVm) => item.idEntrega;

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

  getProgressLabel(value: number): string {
    return `${Math.max(0, Math.min(100, value)).toFixed(2).replace('.00', '')}%`;
  }

  goToDesafiosEntregables(): void {
    this.router.navigate(['/menu-principal/cliente/entregas/desafios-entregables']);
  }

  goToListadoEntregas(modo: 'seguimiento' | 'historial'): void {
    this.router.navigate(['/menu-principal/cliente/entregas/listado'], {
      queryParams: modo === 'seguimiento' ? { estado: 1, origen: modo } : { origen: modo },
    });
  }

  openCreateModal(desafio: DesafioEntregableVm): void {
    if (!desafio.disponibleParaEntrega) return;

    this.modalMode.set('create');
    this.desafioSeleccionado.set(desafio);
    this.entregaSeleccionada.set(null);
    this.modalVisible.set(true);
  }

  openViewModal(entrega: EntregaVm): void {
    this.modalMode.set('view');
    this.entregaSeleccionada.set(entrega);
    this.desafioSeleccionado.set(null);
    this.modalVisible.set(true);
  }

  openEditModal(entrega: EntregaVm): void {
    this.modalMode.set('edit');
    this.entregaSeleccionada.set(entrega);
    this.desafioSeleccionado.set(null);
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
  }

  onSaveEntrega(payload: any): void {
    if (payload?.mode === 'create') {
      this.crearEntrega(payload);
      return;
    }

    if (payload?.mode === 'edit') {
      this.guardarEdicionEntrega(payload);
    }
  }

  onAnularEntrega(payload: any): void {
    const entrega = payload?.entrega as EntregaVm | null;
    if (!entrega) return;

    this.entregasApi.updateEstado(entrega.idEntrega, { idEstadoEntrega: 6 }).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarDashboard();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo anular la entrega.');
      },
    });
  }

  confirmarEntrega(entrega: EntregaVm): void {
    this.entregasApi.updateEstado(entrega.idEntrega, { idEstadoEntrega: 2 }).subscribe({
      next: () => {
        this.cargarDashboard();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo confirmar la entrega.');
      },
    });
  }

  private cargarDashboard(): void {
    this.loading.set(true);
    this.errorMsg.set(null);

    forkJoin({
      desafios: this.desafioApi.listDesafios({
        limit: 100,
        sortBy: 'fechaInicio',
        order: 'desc',
      }),
      inscripciones: this.inscripcionApi.list({
        limit: 100,
      }),
      entregas: this.entregasApi.list({
        limit: 100,
        offset: 0,
      }),
    }).subscribe({
      next: ({ desafios, inscripciones, entregas }) => {
        const desafiosMap = new Map<number, DesafioItem>(
          (desafios.items ?? []).map((d) => [d.idDesafio, d])
        );

        const entregaItems = (entregas.items ?? []).map((e) =>
          this.toEntregaVm(e, desafiosMap.get(e.idDesafio))
        );

        const entregables = (inscripciones.items ?? [])
          .map((ins) => this.toDesafioEntregableVm(ins, desafiosMap.get(ins.idDesafio), entregaItems))
          .filter((x): x is DesafioEntregableVm => !!x)
          .sort((a, b) => new Date(b.fechaAdhesion).getTime() - new Date(a.fechaAdhesion).getTime());

        const idxDestacado = entregables.findIndex((x) => x.disponibleParaEntrega);
        if (idxDestacado >= 0) {
          entregables[idxDestacado] = { ...entregables[idxDestacado], destacado: true };
        } else if (entregables.length) {
          entregables[0] = { ...entregables[0], destacado: true };
        }

        this.desafiosEntregables.set(entregables);
        this.entregas.set(entregaItems);

        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg.set('No se pudieron cargar las entregas del cliente.');
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  private toEntregaVm(item: EntregaListItem, desafio?: DesafioItem): EntregaVm {
    const puntosPorUnidad = desafio?.puntosPorUnidad ?? 0;

    return {
      idEntrega: item.idEntrega,
      idCliente: item.idCliente,
      idDesafio: item.idDesafio,
      idInscripcionDesafio: item.idInscripcionDesafio,
      desafioTitulo: this.toPlainText(desafio?.titulo) || `Desafío #${item.idDesafio}`,
      tipoResiduo: desafio?.tipoResiduo ?? '-',
      unidadMedida: desafio?.unidadMedida ?? 'unidad',
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
      codigoVisible: this.formatCodigoEntrega(item.idEntrega),
      puntosEstimados: Math.round(Number(item.cantidadDeclarada ?? 0) * Number(puntosPorUnidad ?? 0)),
    };
  }

  private toDesafioEntregableVm(
    ins: InscripcionDesafioItem,
    desafio: DesafioItem | undefined,
    entregas: EntregaVm[],
  ): DesafioEntregableVm | null {
    if (!desafio) return null;

    const meta = Number(desafio.meta ?? 0);
    const progresoConsolidado = Number(ins.progreso ?? 0);

    const entregasDeInscripcion = entregas.filter(
      (e) => e.idInscripcionDesafio === ins.idInscripcionDesafio
    );

    const cantidadPendiente = entregasDeInscripcion
      .filter((e) => e.estado === 2)
      .reduce((acc, e) => acc + Number(e.cantidadDeclarada ?? 0), 0);

    const cantidadValidada = entregasDeInscripcion
      .filter((e) => e.estado === 3)
      .reduce((acc, e) => {
        const cantidad = e.cantidadVerificada != null
          ? Number(e.cantidadVerificada)
          : Number(e.cantidadDeclarada ?? 0);
        return acc + cantidad;
      }, 0);

    const existeCreada = entregasDeInscripcion.some((e) => e.estado === 1);

    const progresoValidado =
      meta > 0 ? Number(((cantidadValidada / meta) * 100).toFixed(2)) : 0;

    const progresoActual = Number(
      Math.min(100, progresoConsolidado + progresoValidado).toFixed(2)
    );

    const progresoComprometido =
      meta > 0 ? Number(((cantidadPendiente / meta) * 100).toFixed(2)) : 0;

    const progresoTotalProyectado = Number(
      Math.min(100, progresoActual + progresoComprometido).toFixed(2)
    );

    const estaActivo = desafio.estado === ESTADO_DESAFIO_ACTIVO;
    const estaVigente = this.noEstaVencido(desafio.fechaFin);
    const inscripcionActiva = ins.estado === ESTADO_DESAFIO_ACTIVO;
    const completo = progresoTotalProyectado >= 100;

    let disponibleParaEntrega = true;
    let motivoBloqueo: string | null = null;

    if (!inscripcionActiva) {
      disponibleParaEntrega = false;
      motivoBloqueo = 'Inscripción no activa';
    } else if (!estaActivo) {
      disponibleParaEntrega = false;
      motivoBloqueo =
        desafio.estado === ESTADO_DESAFIO_PAUSADO
          ? 'Desafío pausado'
          : desafio.estado === ESTADO_DESAFIO_FINALIZADO
            ? 'Desafío finalizado'
            : 'Desafío no disponible';
    } else if (!estaVigente) {
      disponibleParaEntrega = false;
      motivoBloqueo = 'Desafío vencido';
    } else if (existeCreada) {
      disponibleParaEntrega = false;
      motivoBloqueo = 'Ya existe una entrega creada';
    } else if (completo) {
      disponibleParaEntrega = false;
      motivoBloqueo = 'Desafío completado';
    }

    return {
      idDesafio: desafio.idDesafio,
      idInscripcionDesafio: ins.idInscripcionDesafio,
      titulo: this.toPlainText(desafio.titulo),
      tipoResiduo: desafio.tipoResiduo,
      unidadMedida: desafio.unidadMedida,
      meta,
      fechaFin: desafio.fechaFin ?? null,
      progresoActual,
      progresoComprometido,
      progresoTotalProyectado,
      puntosAcumulados: ins.puntosAcumulados,
      estadoDesafio: estaActivo
        ? 'ACTIVO'
        : desafio.estado === ESTADO_DESAFIO_PAUSADO
          ? 'PAUSADO'
          : 'FINALIZADO',
      disponibleParaEntrega,
      motivoBloqueo,
      puntosPorUnidad: desafio.puntosPorUnidad ?? null,
      fechaAdhesion: ins.fechaAdhesion,
    };
  }

  private crearEntrega(payload: any): void {
    const desafio = payload?.desafio as DesafioEntregableVm | null;
    const form = payload?.form;

    if (!desafio || !form) return;

    const dto: CreateEntregaDto = {
      idDesafio: desafio.idDesafio,
      idInscripcionDesafio: desafio.idInscripcionDesafio,
      fechaCreacion: new Date().toISOString(),
      fechaVencimiento: this.addDaysIso(15),
      cantidadDeclarada: Number(form.cantidadDeclarada ?? 0).toFixed(3),
      estado: 1,
      observaciones: form.observaciones?.trim() || undefined,
      ubicacion: form.ubicacion?.trim() || 'CORRALON MUNICIPAL',
    };

    this.entregasApi.create(dto).subscribe({
      next: (created) => {
        this.modalVisible.set(false);

        const idEntrega = created?.idEntrega;
        const codigo = idEntrega ? this.formatCodigoEntrega(idEntrega) : 'ENT-PENDIENTE';

        this.successCodigo.set(codigo);
        this.successDesafioTitulo.set(desafio.titulo);
        this.successCantidad.set(Number(form.cantidadDeclarada ?? 0));
        this.successUnidadMedida.set(desafio.unidadMedida || 'unidad');
        this.successModalVisible.set(true);

        this.cargarDashboard();
      },
      error: (err) => {
        console.error(err);
        alert(this.getApiErrorMessage(err, 'No se pudo crear la entrega.'));
      },
    });
  }

  private guardarEdicionEntrega(payload: any): void {
    const entrega = payload?.entrega as EntregaVm | null;
    const form = payload?.form;

    if (!entrega || !form) return;

    this.entregasApi
      .update(entrega.idEntrega, {
        cantidadDeclarada: Number(form.cantidadDeclarada ?? 0).toFixed(3),
        observaciones: form.observaciones?.trim() || undefined,
        ubicacion: form.ubicacion?.trim() || 'CORRALON MUNICIPAL',
      })
      .subscribe({
        next: () => {
          this.modalVisible.set(false);
          this.cargarDashboard();
        },
        error: (err) => {
          console.error(err);
          alert('No se pudo guardar la edición de la entrega.');
        },
      });
  }

  private noEstaVencido(fechaFin?: string | null): boolean {
    if (!fechaFin) return true;
    return new Date(fechaFin).getTime() >= new Date().getTime();
  }

  private addDaysIso(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  }

  private formatCodigoEntrega(idEntrega: number): string {
    return `ENT-${idEntrega}`;
  }

  closeSuccessModal(): void {
    this.successModalVisible.set(false);
  }

  private getApiErrorMessage(err: any, fallback: string): string {
    const msg = err?.error?.message;
    if (Array.isArray(msg)) return msg.join('\n');
    if (typeof msg === 'string' && msg.trim()) return msg;
    return fallback;
  }

  private toPlainText(value?: string | null): string {
    if (!value) return '';
    const div = document.createElement('div');
    div.innerHTML = value;
    return (div.textContent || div.innerText || '').trim();
  }
}