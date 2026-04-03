import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { EntregaClienteModalComponent } from '../ver-entregas-cliente/entrega-cliente-modal.component';
import { DesafioApi, DesafioItem } from '../../../../../api/desafio.api';
import {
  EntregaListItem,
  EntregasApi,
} from '../../../../../api/entrega.api';

type EstadoEntregaCode = 1 | 2 | 3 | 4 | 5 | 6;

interface EntregaItem {
  idEntrega: number;
  codigoVisible: string;
  idDesafio: number;
  desafioTitulo: string;
  tipoResiduo: string;
  cantidadDeclarada: number;
  unidadMedida: string;
  fechaCreacion: string;
  fechaVencimiento: string;
  fechaValidacion?: string | null;
  estado: EstadoEntregaCode;
  observaciones?: string;
  ubicacion?: string;
  motivoRechazo?: string | null;
  puntosEstimados?: number;
}

@Component({
  selector: 'app-listado-entregas-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, DecimalPipe, NgClass, EntregaClienteModalComponent],
  templateUrl: './listado-entregas-cliente.component.html',
  styleUrls: ['./listado-entregas-cliente.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListadoEntregasClienteComponent {
  readonly q = signal('');
  readonly filtroEstado = signal<number | 'TODOS'>('TODOS');
  readonly page = signal(1);
  readonly pageSize = 20;

  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly modalVisible = signal(false);
  readonly modalMode = signal<'view' | 'create' | 'edit'>('view');
  readonly entregaSeleccionada = signal<EntregaItem | null>(null);

  readonly items = signal<EntregaItem[]>([]);

  readonly filteredItems = computed(() => {
    const text = this.q().trim().toLowerCase();
    const estado = this.filtroEstado();

    return this.items().filter((item) => {
      const matchText =
        !text ||
        item.codigoVisible.toLowerCase().includes(text) ||
        item.desafioTitulo.toLowerCase().includes(text) ||
        item.tipoResiduo.toLowerCase().includes(text);

      const matchEstado = estado === 'TODOS' || item.estado === Number(estado);
      return matchText && matchEstado;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredItems().length / this.pageSize))
  );

  readonly pagedItems = computed(() => {
    const currentPage = this.page();
    const start = (currentPage - 1) * this.pageSize;
    return this.filteredItems().slice(start, start + this.pageSize);
  });

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly desafioApi: DesafioApi,
    private readonly entregasApi: EntregasApi,
    private readonly cdr: ChangeDetectorRef,
  ) {
    const estado = this.route.snapshot.queryParamMap.get('estado');
    if (estado) this.filtroEstado.set(Number(estado));
    this.cargarDatos();
  }

  setQuery(value: string): void {
    this.q.set(value);
    this.page.set(1);
  }

  setFiltroEstado(value: number | 'TODOS'): void {
    this.filtroEstado.set(value);
    this.page.set(1);
  }

  prevPage(): void {
    this.page.update((p) => Math.max(1, p - 1));
  }

  nextPage(): void {
    this.page.update((p) => Math.min(this.totalPages(), p + 1));
  }

  volver(): void {
    this.router.navigate(['/menu-principal/cliente/entregas']);
  }

  openView(item: EntregaItem): void {
    this.modalMode.set('view');
    this.entregaSeleccionada.set(item);
    this.modalVisible.set(true);
  }

  openEdit(item: EntregaItem): void {
    this.modalMode.set('edit');
    this.entregaSeleccionada.set(item);
    this.modalVisible.set(true);
  }

  closeModal(): void {
    this.modalVisible.set(false);
  }

  onSaveEntrega(payload: any): void {
    const entrega = payload?.entrega as EntregaItem | null;
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
          this.cargarDatos();
        },
        error: (err) => {
          console.error(err);
          alert('No se pudo guardar la entrega.');
        },
      });
  }

  onAnularEntrega(payload: any): void {
    const entrega = payload?.entrega as EntregaItem | null;
    if (!entrega) return;

    this.entregasApi.updateEstado(entrega.idEntrega, { idEstadoEntrega: 6 }).subscribe({
      next: () => {
        this.modalVisible.set(false);
        this.cargarDatos();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo anular la entrega.');
      },
    });
  }

  confirmar(item: EntregaItem): void {
    this.entregasApi.updateEstado(item.idEntrega, { idEstadoEntrega: 2 }).subscribe({
      next: () => {
        this.cargarDatos();
      },
      error: (err) => {
        console.error(err);
        alert('No se pudo confirmar la entrega.');
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
      1: 'is-creada',
      2: 'is-pendiente',
      3: 'is-validada',
      4: 'is-rechazada',
      5: 'is-puntos',
      6: 'is-anulada',
    };
    return map[estado];
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
      entregas: this.entregasApi.list({
        limit: 100,
      }),
    }).subscribe({
      next: ({ desafios, entregas }) => {
        const desafiosMap = new Map<number, DesafioItem>(
          (desafios.items ?? []).map((d) => [d.idDesafio, d])
        );

        const items = (entregas.items ?? []).map((e) => this.toVm(e, desafiosMap.get(e.idDesafio)));

        this.items.set(items);
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

  private toVm(item: EntregaListItem, desafio?: DesafioItem): EntregaItem {
    const puntosPorUnidad = Number(desafio?.puntosPorUnidad ?? 0);

    return {
      idEntrega: item.idEntrega,
      codigoVisible: `ENT-${item.idEntrega}`,
      idDesafio: item.idDesafio,
      desafioTitulo: this.toPlainText(desafio?.titulo) || `Desafío #${item.idDesafio}`,
      tipoResiduo: desafio?.tipoResiduo ?? '-',
      cantidadDeclarada: Number(item.cantidadDeclarada ?? 0),
      unidadMedida: desafio?.unidadMedida ?? 'unidad',
      fechaCreacion: item.fechaCreacion,
      fechaVencimiento: item.fechaVencimiento,
      fechaValidacion: item.fechaValidacion ?? null,
      estado: item.estado,
      observaciones: item.observaciones ?? '',
      ubicacion: item.ubicacion ?? 'CORRALON MUNICIPAL',
      motivoRechazo: item.motivoRechazo ?? null,
      puntosEstimados: Math.round(Number(item.cantidadDeclarada ?? 0) * puntosPorUnidad),
    };
  }

  private toPlainText(value?: string | null): string {
    if (!value) return '';
    const div = document.createElement('div');
    div.innerHTML = value;
    return (div.textContent || div.innerText || '').trim();
  }
}