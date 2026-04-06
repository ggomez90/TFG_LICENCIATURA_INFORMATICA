import { Component, EventEmitter, Output, inject, OnInit, OnDestroy, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { UsuariosApi, AdminCreateUsuarioDto } from '../../../api/usuarios.api';
import { ToastService } from '../../../shared/toast.service';
import { normalizeHttpError } from '../../../shared/http-error.util';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  standalone: true,
  selector: 'app-usuario-create-dialog',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './usuario-create-dialog.component.html',
  styleUrls: ['./usuario-create-dialog.component.scss'],
})
export class UsuarioCreateDialogComponent implements OnInit, OnDestroy {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  @ViewChild('firstInput') firstInput!: ElementRef<HTMLInputElement>;

  private fb = inject(FormBuilder);
  private api = inject(UsuariosApi);
  private toast = inject(ToastService);

  loading = false;

  form: FormGroup = this.fb.group({
    nombres: ['', [Validators.required, Validators.maxLength(80)]],
    apellidos: ['', [Validators.required, Validators.maxLength(80)]],
    usuario: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(40)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    dniCuitCuil: [''],
    idRolUsuario: [3, [Validators.required]], // 1=ADMIN,2=OPERARIO,3=CLIENTE (default)
  });

  get f() { return this.form.controls as Record<string, any>; }

  ngOnInit(): void {
    // Bloquea scroll del body mientras el modal está abierto
    try { document.body.style.overflow = 'hidden'; } catch {}
    // Foco inicial
    setTimeout(() => this.firstInput?.nativeElement?.focus(), 0);
  }

  ngOnDestroy(): void {
    // Restaura scroll
    try { document.body.style.overflow = ''; } catch {}
  }

  @HostListener('document:keydown.escape')
  onEsc() { this.cancel(); }

  private markDuplicate(controlName: 'email' | 'usuario' | 'dniCuitCuil') {
    const ctl = this.f[controlName];
    if (!ctl) return;
    // preserva otros errores si los hubiera
    const prev = ctl.errors || {};
    ctl.setErrors({ ...prev, duplicate: true });
    ctl.markAsTouched();
  }

  private focusControl(controlName: 'email' | 'usuario' | 'dniCuitCuil') {
    const el = document.querySelector<HTMLInputElement>(`[formcontrolname="${controlName}"]`);
    el?.focus();
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto: AdminCreateUsuarioDto = {
      nombres: this.f['nombres'].value?.trim(),
      apellidos: this.f['apellidos'].value?.trim(),
      usuario: this.f['usuario'].value?.trim(),
      email: this.f['email'].value?.trim(),
      dniCuitCuil: this.f['dniCuitCuil'].value?.trim() || null,
      idRolUsuario: Number(this.f['idRolUsuario'].value) as 1 | 2 | 3,
    };

    this.loading = true;
    try {
      const resp = await this.api.createByAdmin(dto).toPromise();
      const msg = (resp as any)?.message || 'Usuario creado. Se envió un correo de verificación y actualización de contraseña.';
      this.toast.success(msg);
      try { alert(msg); } catch {}
      this.saved.emit();
      this.close.emit();
    } catch (e) {
      // Mensaje base
      const fallback = normalizeHttpError(e);

      // Intento extraer status y mensaje del backend
      const httpErr = e as HttpErrorResponse;
      const status = httpErr?.status;
      const beMsg: string = (
        (httpErr?.error?.message ?? httpErr?.error) ||
        httpErr?.message ||
        ''
      ).toString();

      // Si es 409 (duplicado) se mapea a los campos específicos
      if (status === 409 && beMsg) {
        const lower = beMsg.toLowerCase();

        // Orden de chequeo: email / usuario / dni
        if (lower.includes('email')) {
          this.markDuplicate('email');
          this.toast.error('El email ya está registrado.');
          this.focusControl('email');
        } else if (lower.includes('usuario')) {
          this.markDuplicate('usuario');
          this.toast.error('El nombre de usuario ya está registrado.');
          this.focusControl('usuario');
        } else if (lower.includes('dni') || lower.includes('cuit') || lower.includes('cuil')) {
          this.markDuplicate('dniCuitCuil');
          this.toast.error('El DNI/CUIT/CUIL ya está registrado.');
          this.focusControl('dniCuitCuil');
        } else {
          this.toast.error(beMsg);
        }

        // mantiene alert
        try { alert(beMsg); } catch {}
      } else {
        // Otros errores con flujo actual
        this.toast.error(fallback);
        try { alert(fallback); } catch {}
      }
    } finally {
      this.loading = false;
    }
  }

  cancel() {
    this.close.emit();
  }
}
