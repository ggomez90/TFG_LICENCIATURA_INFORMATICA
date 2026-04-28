import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe, NgClass } from '@angular/common';

type EstadoEntregaCode = 1 | 2 | 3 | 4 | 5 | 6;

export interface EntregaOperarioModalVm {
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
  selector: 'app-entrega-operario-modal',
  standalone: true,
  imports: [CommonModule, NgClass, DatePipe, DecimalPipe],
  templateUrl: './entrega-operario-modal.component.html',
  styleUrls: ['./entrega-operario-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregaOperarioModalComponent {
  @Input() visible = false;

  private readonly entregaSignal = signal<EntregaOperarioModalVm | null>(null);

@Input()
  set entrega(value: EntregaOperarioModalVm | null) {
    this.entregaSignal.set(value);
    this.motivoRechazo.set('');
  }
  get entrega(): EntregaOperarioModalVm | null {
    return this.entregaSignal();
  }

  @Output() closeModal = new EventEmitter<void>();
  @Output() validarEntrega = new EventEmitter<EntregaOperarioModalVm>();
  @Output() rechazarEntrega = new EventEmitter<{ entrega: EntregaOperarioModalVm; motivo?: string }>();
  @Output() volverPendiente = new EventEmitter<EntregaOperarioModalVm>();
  @Output() confirmarPuntos = new EventEmitter<EntregaOperarioModalVm>();

  readonly motivoRechazo = signal('');

  readonly estadoActual = computed(() => this.entregaSignal()?.estado ?? null);

  readonly mostrarCerrar = computed(() => !!this.entregaSignal());

  readonly mostrarValidar = computed(() => this.estadoActual() === 2);
  readonly mostrarRechazar = computed(() => this.estadoActual() === 2);

  readonly mostrarPendiente = computed(() => {
    const estado = this.estadoActual();
    return estado === 3 || estado === 4;
  });

  readonly mostrarConfirmarPuntos = computed(() => this.estadoActual() === 3);

  readonly esPendiente = computed(() => this.estadoActual() === 2);

  readonly motivoRechazoLimpio = computed(() => this.motivoRechazo().trim());

  readonly puedeValidar = computed(() =>
    this.estadoActual() === 2 && this.motivoRechazoLimpio().length === 0
  );

  readonly puedeRechazar = computed(() =>
    this.estadoActual() === 2 && this.motivoRechazoLimpio().length > 0
  );

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

  onClose(): void {
    this.motivoRechazo.set('');
    this.closeModal.emit();
  }

  onValidar(): void {
    const entrega = this.entregaSignal();
    if (!entrega || entrega.estado !== 2) return;
    if (!this.puedeValidar()) return;

    this.validarEntrega.emit(entrega);
  }

  onRechazar(): void {
    const entrega = this.entregaSignal();
    if (!entrega || entrega.estado !== 2) return;
    if (!this.puedeRechazar()) return;

    this.rechazarEntrega.emit({
      entrega,
      motivo: this.motivoRechazoLimpio(),
    });
  }

  onVolverPendiente(): void {
    const entrega = this.entregaSignal();
    if (!entrega) return;
    if (entrega.estado !== 3 && entrega.estado !== 4) return;
    this.volverPendiente.emit(entrega);
  }

  onConfirmarPuntos(): void {
    const entrega = this.entregaSignal();
    if (!entrega || entrega.estado !== 3) return;
    this.confirmarPuntos.emit(entrega);
  }
}