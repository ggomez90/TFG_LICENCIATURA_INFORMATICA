import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { UsuariosApi } from '../../../api/usuarios.api';

@Component({
  standalone: true,
  selector: 'app-usuario-ban-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-ban-dialog.component.html',
  styleUrls: ['./usuario-ban-dialog.component.scss'],
})
export class UsuarioBanDialogComponent {
  @Input() usuario!: { id: number; nombreUsuario: string; email: string; };
  @Output() close = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private api = inject(UsuariosApi);

  loading = false;

  form: FormGroup = this.fb.group({
    motivo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
  });

  get f() { return this.form.controls as Record<string, any>; }

  cancel() {
    if (this.loading) return;
    this.close.emit();
  }

  submit() {
    const control = this.f['motivo'];

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const motivo = control.value?.trim() ?? '';

    // evita que solo espacios pasen la validación
    if (!motivo || motivo.length < 5 || motivo.length > 300) {
      control.setErrors({ ...control.errors, trimmedInvalid: true });
      control.markAsTouched();
      return;
    }

    this.loading = true;
    this.api.ban(this.usuario.id, { motivo }).subscribe({
      next: () => {
        this.loading = false;
        this.confirmed.emit();
      },
      error: (e) => {
        this.loading = false;
        alert(e?.message || 'Error al banear');
      }
    });
  }
}