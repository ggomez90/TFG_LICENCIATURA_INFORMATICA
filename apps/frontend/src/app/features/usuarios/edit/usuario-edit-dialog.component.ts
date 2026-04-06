import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { UsuariosApi, UpdateUsuarioDto } from '../../../api/usuarios.api';

@Component({
  standalone: true,
  selector: 'app-usuario-edit-dialog',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './usuario-edit-dialog.component.html',
  styleUrls: ['./usuario-edit-dialog.component.scss'],
})
export class UsuarioEditDialogComponent {
  @Input() usuario!: {
    id: number;
    nombreUsuario: string;
    propietario: string;
    dniCuitCuil: string;
    email: string;
    tipo: 'admin' | 'operario' | 'cliente';
    estadoId: 1|2|3; // 1=PENDIENTE, 2=HABILITADO, 3=BANEADO
    motivoBan?: string | null;
  };

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private api = inject(UsuariosApi);

  loading = false;

  // estado original para detectar cambios
  private estadoOriginal: 1|2|3 = 2;

  // motivo del ban cuando se selecciona BANEADO
  banMotivo: string = '';
  showBanReason = false;
  banMotivoReadonly = false; // bloquea textarea cuando ya viene baneado

  form: FormGroup = this.fb.group({
    nombres: ['', [Validators.maxLength(80)]],
    apellidos: ['', [Validators.maxLength(80)]],
    usuario: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
    email: [{value: '', disabled: true}],
    dniCuitCuil: [''],
    idRolUsuario: [3, [Validators.required]],
    idEstadoUsuario: [2, [Validators.required]], // estado editable
  });

  get f(){ return this.form.controls as Record<string, any>; }

  ngOnInit() {
    // Ppropietario en nombres/apellidos igual que antes
    const partes = (this.usuario.propietario ?? '').trim().split(/\s+/);
    const apellidos = partes.length ? partes[partes.length - 1] : '';
    const nombres = partes.length > 1 ? partes.slice(0, -1).join(' ') : '';

    const rol =
      this.usuario.tipo === 'admin' ? 1 :
      this.usuario.tipo === 'operario' ? 2 : 3;

    this.estadoOriginal = this.usuario.estadoId;

    this.form.patchValue({
      nombres,
      apellidos,
      usuario: this.usuario.nombreUsuario,
      email: this.usuario.email,
      dniCuitCuil: this.usuario.dniCuitCuil,
      idRolUsuario: rol,
      idEstadoUsuario: this.usuario.estadoId, // 2 o 3
    });

    // Mostrar bloque y prellenar si ya viene baneado ( bloquea edición)
    this.showBanReason = this.usuario.estadoId === 3;
    if (this.usuario.estadoId === 3) {
      this.banMotivo = (this.usuario.motivoBan ?? '');
      this.banMotivoReadonly = true; // bloqueado si ya está baneado
    } else {
      this.banMotivo = '';
      this.banMotivoReadonly = false;
    }
  }

  onEstadoChange() {
    const nuevo = Number(this.f['idEstadoUsuario'].value) as 1|2|3;

    // Si el nuevo estado es BANEADO, mostrar bloque
    this.showBanReason = (nuevo === 3);

    if (nuevo === 3) {
      if (this.estadoOriginal === 3) {
        // Ya venía baneado mantiene motivo existente y bloqueado
        this.banMotivo = (this.usuario.motivoBan ?? '');
        this.banMotivoReadonly = true;
      } else {
        // Transición HABILITADO a BANEADO pide motivo editable
        this.banMotivo = '';
        this.banMotivoReadonly = false;
      }
    } else {
      // No baneado ocultar/cancelar motivo
      this.banMotivo = '';
      this.banMotivoReadonly = false;
    }
  }

  cancel(){ this.close.emit(); }

  submit(){
    if (this.form.invalid){ this.form.markAllAsTouched(); return; }

    const idRolUsuario = Number(this.f['idRolUsuario'].value) as 1|2|3;
    const idEstadoUsuario = Number(this.f['idEstadoUsuario'].value) as 1|2|3;

    // Validar motivo SOLO si pasa de habilitado a baneado
    if (idEstadoUsuario === 3 && this.estadoOriginal !== 3) {
      const m = (this.banMotivo || '').trim();
      if (!m || m.length < 1 || m.length > 300) {
        alert('Ingresá un motivo de ban (1 a 300 caracteres).');
        return;
      }
    }

    const dto: UpdateUsuarioDto = {
      nombres: this.f['nombres'].value?.trim() || null,
      apellidos: this.f['apellidos'].value?.trim() || null,
      dniCuitCuil: this.f['dniCuitCuil'].value?.trim() || null,
      idRolUsuario,
      // email no editable
    };

    this.loading = true;

    // Guarda datos generales
    this.api.updateByAdmin(this.usuario.id, dto).subscribe({
      next: () => {
        // Cambios de estado si corresponde
        const cambiosEstado = idEstadoUsuario !== this.estadoOriginal;

        if (!cambiosEstado) {
          this.loading = false;
          this.saved.emit();
          return;
        }

        if (idEstadoUsuario === 3 && this.estadoOriginal !== 3) {
          // HABILITADO a BANEADO: ban con motivo
          (this.api as any).ban(this.usuario.id, { motivo: (this.banMotivo || '').trim() }).subscribe({
            next: () => { this.loading = false; this.saved.emit(); },
            error: (e: any) => { this.loading = false; alert(e?.message || 'Error al banear'); }
          });
        } else if (idEstadoUsuario === 2 && this.estadoOriginal === 3) {
          // BANEADO a HABILITADO: enable (back deja motivoBan en NULL)
          this.api.enable(this.usuario.id, { idEstadoUsuario: 2 }).subscribe({
            next: () => { this.loading = false; this.saved.emit(); },
            error: (e: any) => { this.loading = false; alert(e?.message || 'Error al habilitar'); }
          });
        } else {
          this.loading = false;
          this.saved.emit();
        }
      },
      error: (e) => {
        this.loading = false;
        alert(e?.message || 'Error al actualizar');
      }
    });
  }
}
