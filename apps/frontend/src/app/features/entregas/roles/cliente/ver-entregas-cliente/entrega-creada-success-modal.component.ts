import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entrega-creada-success-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entrega-creada-success-modal.component.html',
  styleUrls: ['./entrega-creada-success-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntregaCreadaSuccessModalComponent {
  @Input() visible = false;
  @Input() codigo = '';
  @Input() desafioTitulo = '';
  @Input() cantidad = 0;
  @Input() unidadMedida = '';
  @Input() estadoLabel = 'Creada';

  @Output() closeModal = new EventEmitter<void>();

  close(): void {
    this.closeModal.emit();
  }
}