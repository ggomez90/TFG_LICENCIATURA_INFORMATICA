import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NotificacionApi, EditarNotificacionDto } from '../../../api/notificacion.api';

@Component({
  selector: 'app-editar-notificacion-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-notificacion-admin.component.html',
  styleUrls: ['./editar-notificacion-admin.component.scss'],
})
export class EditarNotificacionAdminComponent implements OnInit {
  private readonly notificacionApi = inject(NotificacionApi);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  idNotificacion = signal<number | null>(null);
  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);

  form = signal<EditarNotificacionDto>({
    idRolUsuario: 2,
    titulo: '',
    mensaje: '',
    visible: false,
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.error.set('No se recibió un id de notificación válido.');
      this.cargando.set(false);
      return;
    }

    this.idNotificacion.set(id);
    this.cargarNotificacion(id);
  }

  private cargarNotificacion(id: number): void {
    this.cargando.set(true);
    this.error.set(null);

    this.notificacionApi.getAll({
      limit: 100,
      offset: 0,
    }).subscribe({
      next: (resp) => {
        const item = (resp?.items ?? []).find((x: any) => x.idNotificacion === id);

        if (!item) {
          this.error.set('No se encontró la notificación.');
          this.cargando.set(false);
          return;
        }

        if (item.visible) {
          this.error.set('Solo se pueden editar notificaciones en estado NO VISIBLE.');
          this.cargando.set(false);
          return;
        }

        this.form.set({
          idRolUsuario: item.idRolUsuario,
          titulo: item.titulo,
          mensaje: item.mensaje,
          visible: item.visible,
        });

        this.cargando.set(false);
      },
      error: (err) => {
        console.error('[EditarNotificacionAdmin] Error cargando notificación', err);
        this.error.set(err?.error?.message ?? 'No se pudo cargar la notificación.');
        this.cargando.set(false);
      },
    });
  }

  actualizar<K extends keyof EditarNotificacionDto>(campo: K, valor: EditarNotificacionDto[K]): void {
    this.form.update(f => ({ ...f, [campo]: valor }));
  }

  cancelar(): void {
    this.router.navigate(['/menu-principal/admin/notificaciones']);
  }

  guardar(): void {
    const id = this.idNotificacion();
    const payload = this.form();

    if (!id) {
      this.error.set('No se pudo identificar la notificación a editar.');
      return;
    }

    if (!payload.titulo?.trim()) {
      this.error.set('Debes ingresar un título.');
      return;
    }

    if (!payload.mensaje?.trim()) {
      this.error.set('Debes ingresar un mensaje.');
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.notificacionApi.update(id, {
      idRolUsuario: Number(payload.idRolUsuario),
      titulo: payload.titulo.trim(),
      mensaje: payload.mensaje.trim(),
      visible: false,
    }).subscribe({
      next: () => {
        this.guardando.set(false);
        this.router.navigate(['/menu-principal/admin/notificaciones']);
      },
      error: (err) => {
        console.error('[EditarNotificacionAdmin] Error editando notificación', err);
        this.error.set(err?.error?.message ?? 'No se pudo editar la notificación.');
        this.guardando.set(false);
      },
    });
  }
}