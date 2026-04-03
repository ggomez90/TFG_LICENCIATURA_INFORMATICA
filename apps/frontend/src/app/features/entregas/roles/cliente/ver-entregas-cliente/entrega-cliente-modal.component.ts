import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

type ModalMode = 'view' | 'create' | 'edit';
type EstadoEntregaCode = 1 | 2 | 3 | 4 | 5 | 6;

@Component({
  selector: 'app-entrega-cliente-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, NgClass],
  templateUrl: './entrega-cliente-modal.component.html',
  styleUrls: ['./entrega-cliente-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregaClienteModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() mode: ModalMode = 'view';
  @Input() entrega: any | null = null;
  @Input() desafio: any | null = null;

  @Output() closeModal = new EventEmitter<void>();
  @Output() saveEntrega = new EventEmitter<any>();
  @Output() anularEntrega = new EventEmitter<any>();
  @Output() editEntrega = new EventEmitter<any>();

  readonly form = signal({
    cantidadDeclarada: 0,
    observaciones: '',
    ubicacion: 'CORRALON MUNICIPAL',
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['entrega'] || changes['desafio'] || changes['mode']) {
      if ((this.mode === 'edit' || this.mode === 'view') && this.entrega) {
        this.form.set({
          cantidadDeclarada: Number(this.entrega.cantidadDeclarada ?? 0),
          observaciones: this.entrega.observaciones ?? '',
          ubicacion: this.entrega.ubicacion ?? 'CORRALON MUNICIPAL',
        });
        return;
      }

      this.form.set({
        cantidadDeclarada: 0,
        observaciones: '',
        ubicacion: 'CORRALON MUNICIPAL',
      });
    }
  }

  get title(): string {
    if (this.mode === 'create') return 'Registrar entrega';
    if (this.mode === 'edit') return 'Editar entrega';
    return 'Detalle de entrega';
  }

  get codigoVisible(): string {
    if (this.entrega?.codigoVisible) return this.entrega.codigoVisible;
    return 'ENT-PREVIA';
  }

  get canEditFields(): boolean {
    return this.mode === 'edit' || this.mode === 'create';
  }

  get isEntregaCreada(): boolean {
    return this.entrega?.estado === 1;
  }

  get isEntregaPendiente(): boolean {
    return this.entrega?.estado === 2;
  }

  get showCrearButton(): boolean {
    return this.mode === 'create';
  }

  get showGuardarButton(): boolean {
    return this.mode === 'edit';
  }

  get showEditarButton(): boolean {
    return this.mode === 'view' && this.isEntregaCreada;
  }

  get showAnularButton(): boolean {
    return this.mode === 'view' && (this.isEntregaCreada || this.isEntregaPendiente);
  }

  patchField<K extends 'cantidadDeclarada' | 'observaciones' | 'ubicacion'>(key: K, value: any): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  close(): void {
    this.closeModal.emit();
  }

  save(): void {
    this.saveEntrega.emit({
      mode: this.mode,
      entrega: this.entrega,
      desafio: this.desafio,
      form: this.form(),
    });
  }

  anular(): void {
    this.anularEntrega.emit({
      entrega: this.entrega,
      desafio: this.desafio,
    });
  }

  editar(): void {
    this.editEntrega.emit({
      entrega: this.entrega,
    });
  }

  getEstadoLabel(estado: EstadoEntregaCode | undefined): string {
    const map: Record<EstadoEntregaCode, string> = {
      1: 'Creada',
      2: 'Pendiente',
      3: 'Validada',
      4: 'Rechazada',
      5: 'Puntos otorgados',
      6: 'Anulada',
    };
    return estado ? map[estado] : 'Nueva';
  }

  getEstadoClass(estado: EstadoEntregaCode | undefined): string {
    const map: Record<EstadoEntregaCode, string> = {
      1: 'is-creada',
      2: 'is-pendiente',
      3: 'is-validada',
      4: 'is-rechazada',
      5: 'is-puntos',
      6: 'is-anulada',
    };
    return estado ? map[estado] : 'is-creada';
  }
}