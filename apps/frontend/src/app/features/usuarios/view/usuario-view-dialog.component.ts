import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

type Rol = 'admin' | 'operario' | 'cliente';

export interface UsuarioViewVM {
  id: number;
  nombreUsuario: string;
  propietario: string;       // nombre completo en una sola cadena
  dniCuitCuil: string;
  email: string;
  tipo: Rol;
  estadoId: 1 | 2 | 3;       // 1=PENDIENTE, 2=HABILITADO, 3=BANEADO
  motivoBan?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-usuario-view-dialog',
  imports: [CommonModule],
  templateUrl: './usuario-view-dialog.component.html',
  styleUrls: ['./usuario-view-dialog.component.scss'],
})
export class UsuarioViewDialogComponent implements OnChanges {
  @Input() usuario!: UsuarioViewVM;
  @Output() close = new EventEmitter<void>();

  // derivadas para clonar el layout del edit sin calcular en el template
  nombres = '';
  apellidos = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario) {
      const full = (this.usuario.propietario || '').trim();
      if (!full) {
        this.nombres = '';
        this.apellidos = '';
      } else {
        const parts = full.split(/\s+/);
        this.nombres = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
        this.apellidos = parts.length > 0 ? parts.slice(-1).join(' ') : '';
      }
    }
  }

  cancel(){ this.close.emit(); }
}
