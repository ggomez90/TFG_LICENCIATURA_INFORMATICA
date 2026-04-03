import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EntregaClienteModalComponent } from '../ver-entregas-cliente/entrega-cliente-modal.component';
import { EntregaCreadaSuccessModalComponent } from '../ver-entregas-cliente/entrega-creada-success-modal.component';
import { DesafioApi, DesafioItem } from '../../../../../api/desafio.api';
import {
  InscripcionApi,
  InscripcionDesafioItem,
} from '../../../../../api/inscripcion.api';
import {
  CreateEntregaDto,
  EntregaListItem,
  EntregasApi,
} from '../../../../../api/entrega.api';

interface DesafioEntregableItem {
  idDesafio: number;
  idInscripcionDesafio: number;
  titulo: string;
  tipoResiduo: string;
  unidadMedida: string;
  meta: number;
  fechaAdhesion: string;
  fechaFin: string | null;
  estadoDesafio: 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
  progresoActual: number;
  progresoComprometido: number;
  progresoTotalProyectado: number;
  disponibleParaEntrega: boolean;
  motivoBloqueo?: string | null;
  puntosAcumulados: number;
}

interface EntregaVmLite {
  idEntrega: number;
  idInscripcionDesafio: number;
  estado: number;
  cantidadDeclarada: number;
}

const ESTADO_DESAFIO_ACTIVO = 1;
const ESTADO_DESAFIO_PAUSADO = 2;
const ESTADO_DESAFIO_FINALIZADO = 3;

@Component({
  selector: 'app-listado-desafios-entregables-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe, EntregaClienteModalComponent, EntregaCreadaSuccessModalComponent],
  templateUrl: './listado-desafios-entregables-cliente.component.html',
  styleUrls: ['./listado-desafios-entregables-cliente.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoDesafiosEntregablesClienteComponent {
  readonly q = signal('');
  readonly filtroEstado = signal<'TODOS' | 'DISPONIBLES' | 'BLOQUEADOS'>('TODOS');

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly modalVisible = signal(false);
  readonly desafioSeleccionado = signal<DesafioEntregableItem | null>(null);

  //model sucess
  readonly successModalVisible = signal(false);
  readonly successCodigo = signal('');
  readonly successDesafioTitulo = signal('');
  readonly successCantidad = signal(0);
  readonly successUnidadMedida = signal('');

  readonly items = signal<DesafioEntregableItem[]>([]);

  readonly filteredItems = computed(() => {
    const text = this.q().trim().toLowerCase();
    const estado = this.filtroEstado();

    return this.items().filter((item) => {
      const matchText =
        !text ||
        item.titulo.toLowerCase().includes(text) ||
        item.tipoResiduo.toLowerCase().includes(text);

      const matchEstado =
        estado === 'TODOS' ||
        (estado === 'DISPONIBLES' && item.disponibleParaEntrega) ||
        (estado === 'BLOQUEADOS' && !item.disponibleParaEntrega);

      return matchText && matchEstado;
    });
  });

  constructor(
    private readonly router: Router,
    private readonly desafioApi: DesafioApi,
    private readonly inscripcionApi: InscripcionApi,
    private readonly entregasApi: EntregasApi,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.cargarDatos();
  }

  setQuery(value: string): void {
    this.q.set(value);
  }

  setFiltroEstado(value: 'TODOS' | 'DISPONIBLES' | 'BLOQUEADOS'): void {
    this.filtroEstado.set(value);
  }

  volver(): void {
    this.router.navigate(['/menu-principal/cliente/entregas']);
  }

  openCreateModal(item: DesafioEntregableItem): void {
    if (!item.disponibleParaEntrega) return;
    this.desafioSeleccionado.set(item);
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
  }

  onSaveEntrega(payload: any): void {
    const desafio = payload?.desafio as DesafioEntregableItem | null;
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
        const codigo = idEntrega ? `ENT-${idEntrega}` : 'ENT-PENDIENTE';

        this.successCodigo.set(codigo);
        this.successDesafioTitulo.set(desafio.titulo);
        this.successCantidad.set(Number(form.cantidadDeclarada ?? 0));
        this.successUnidadMedida.set(desafio.unidadMedida || 'unidad');
        this.successModalVisible.set(true);

        this.cargarDatos();
      },
      error: (err) => {
        console.error(err);
        alert(this.getApiErrorMessage(err, 'No se pudo crear la entrega.'));
      },
    });
  }

  getProgressLabel(value: number): string {
    return `${Math.max(0, Math.min(100, value)).toFixed(2).replace('.00', '')}%`;
  }

  private cargarDatos(): void {
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
      }),
    }).subscribe({
      next: ({ desafios, inscripciones, entregas }) => {
        const desafiosMap = new Map<number, DesafioItem>(
          (desafios.items ?? []).map((d) => [d.idDesafio, d])
        );

        const entregasLite: EntregaVmLite[] = (entregas.items ?? []).map((e: EntregaListItem) => ({
          idEntrega: e.idEntrega,
          idInscripcionDesafio: e.idInscripcionDesafio,
          estado: e.estado,
          cantidadDeclarada: Number(e.cantidadDeclarada ?? 0),
        }));

        const items = (inscripciones.items ?? [])
          .map((ins) => this.toVm(ins, desafiosMap.get(ins.idDesafio), entregasLite))
          .filter((x): x is DesafioEntregableItem => !!x)
          .sort((a, b) => new Date(b.fechaAdhesion).getTime() - new Date(a.fechaAdhesion).getTime());

        this.items.set(items);
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.errorMsg.set('No se pudieron cargar los desafíos entregables.');
        this.loading.set(false);
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
    });
  }

  private toVm(
    ins: InscripcionDesafioItem,
    desafio: DesafioItem | undefined,
    entregas: EntregaVmLite[],
  ): DesafioEntregableItem | null {
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
      .reduce((acc, e) => acc + Number(e.cantidadDeclarada ?? 0), 0);

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
      fechaAdhesion: ins.fechaAdhesion,
      fechaFin: desafio.fechaFin ?? null,
      estadoDesafio: estaActivo
        ? 'ACTIVO'
        : desafio.estado === ESTADO_DESAFIO_PAUSADO
          ? 'PAUSADO'
          : 'FINALIZADO',
      progresoActual,
      progresoComprometido,
      progresoTotalProyectado,
      disponibleParaEntrega,
      motivoBloqueo,
      puntosAcumulados: ins.puntosAcumulados,
    };
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