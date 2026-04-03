import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NotificacionApi, CrearNotificacionDto } from '../../../api/notificacion.api';

@Component({
  selector: 'app-crear-notificacion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-notificacion-admin.component.html',
  styleUrls: ['./crear-notificacion-admin.component.scss'],
})
export class CrearNotificacionAdminComponent {
  private readonly notificacionApi = inject(NotificacionApi);
  private readonly router = inject(Router);

  guardando = signal(false);
  error = signal<string | null>(null);

  form = signal<CrearNotificacionDto>({
    idRolUsuario: 2,
    titulo: '',
    mensaje: '',
    visible: true,
  });

  actualizar<K extends keyof CrearNotificacionDto>(campo: K, valor: CrearNotificacionDto[K]): void {
    this.form.update(f => ({ ...f, [campo]: valor }));
  }

  cancelar(): void {
    this.router.navigate(['/menu-principal/admin/notificaciones']);
  }

  guardar(): void {
    const payload = this.form();

    if (!payload.titulo.trim()) {
      this.error.set('Debes ingresar un título.');
      return;
    }

    if (!payload.mensaje.trim()) {
      this.error.set('Debes ingresar un mensaje.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.notificacionApi.create({
      idRolUsuario: Number(payload.idRolUsuario),
      titulo: payload.titulo.trim(),
      mensaje: payload.mensaje.trim(),
      visible: !!payload.visible,
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/menu-principal/admin/notificaciones']);
      },
      error: (err) => {
        console.error('[CrearNotificacionAdmin] Error creando notificación', err);
        this.error.set(err?.error?.message ?? 'No se pudo crear la notificación.');
        this.guardando.set(false);
      },
    });
  }
}