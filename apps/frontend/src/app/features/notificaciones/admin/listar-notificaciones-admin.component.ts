import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NotificacionApi, NotificacionItem } from '../../../api/notificacion.api';

@Component({
  selector: 'app-listar-notificaciones-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listar-notificaciones-admin.component.html',
  styleUrls: ['./listar-notificaciones-admin.component.scss'],
})
export class ListarNotificacionesAdminComponent implements OnInit {
  private readonly notificacionApi = inject(NotificacionApi);
  private readonly router = inject(Router);

  readonly pageSize = 20;

  cargando = signal(false);
  error = signal<string | null>(null);
  notificaciones = signal<NotificacionItem[]>([]);

  filtroTexto = signal('');
  filtroRol = signal<string>('');
  filtroVisible = signal<string>('');

  total = signal(0);
  paginaActual = signal(1);

  totalPaginas = computed(() => {
    const total = this.total();
    return total > 0 ? Math.ceil(total / this.pageSize) : 1;
  });

  puedeIrAtras = computed(() => this.paginaActual() > 1);
  puedeIrSiguiente = computed(() => this.paginaActual() < this.totalPaginas());

  notificacionesFiltradas = computed(() => {
    const texto = this.filtroTexto().trim().toLowerCase();
    const rol = this.filtroRol();
    const visible = this.filtroVisible();

    return this.notificaciones().filter((item) => {
      const matchTexto =
        !texto ||
        item.titulo.toLowerCase().includes(texto) ||
        item.mensaje.toLowerCase().includes(texto);

      const matchRol = !rol || String(item.idRolUsuario) === rol;
      const matchVisible = !visible || String(item.visible) === visible;

      return matchTexto && matchRol && matchVisible;
    });
  });

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.cargando.set(true);
    this.error.set(null);

    const offset = (this.paginaActual() - 1) * this.pageSize;

    this.notificacionApi.getAll({
      limit: this.pageSize,
      offset,
    }).subscribe({
      next: (resp) => {
        this.notificaciones.set(resp?.items ?? []);
        this.total.set(resp?.total ?? 0);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('[ListarNotificacionesAdmin] Error cargando notificaciones', err);
        this.error.set(err?.error?.message ?? 'No se pudieron cargar las notificaciones.');
        this.notificaciones.set([]);
        this.total.set(0);
        this.cargando.set(false);
      },
    });
  }

  irCrear(): void {
    this.router.navigate(['/menu-principal/admin/notificaciones/crear']);
  }

  irEditar(idNotificacion: number): void {
    this.router.navigate(['/menu-principal/admin/notificaciones/editar', idNotificacion]);
  }

  puedeEditar(item: NotificacionItem): boolean {
    return !item.visible;
  }

  onEditarClick(item: NotificacionItem): void {
    if (!this.puedeEditar(item)) {
      alert('Solo se pueden editar notificaciones que estén en estado NO VISIBLE.');
      return;
    }

    this.irEditar(item.idNotificacion);
  }

  cambiarVisible(item: NotificacionItem): void {
    const accion = item.visible ? 'ocultar' : 'mostrar';
    const confirmado = confirm(`¿Deseas ${accion} esta notificación?`);

    if (!confirmado) return;

    this.notificacionApi.updateVisible(item.idNotificacion, {
      visible: !item.visible,
    }).subscribe({
      next: () => {
        this.notificaciones.update((items) =>
          items.map((x) =>
            x.idNotificacion === item.idNotificacion
              ? { ...x, visible: !x.visible }
              : x
          )
        );
      },
      error: (err) => {
        console.error('[ListarNotificacionesAdmin] Error actualizando visible', err);
        this.error.set(err?.error?.message ?? 'No se pudo actualizar la visibilidad.');
      },
    });
  }

  actualizarFiltroTexto(value: string): void {
    this.filtroTexto.set(value);
  }

  irAtras(): void {
    if (!this.puedeIrAtras()) return;
    this.paginaActual.update((p) => p - 1);
    this.cargarNotificaciones();
  }

  irSiguiente(): void {
    if (!this.puedeIrSiguiente()) return;
    this.paginaActual.update((p) => p + 1);
    this.cargarNotificaciones();
  }

  trackByNotif(_: number, item: NotificacionItem): number {
    return item.idNotificacion;
  }

  rolLabel(idRolUsuario: number): string {
    if (idRolUsuario === 2) return 'OPERARIO';
    if (idRolUsuario === 3) return 'CLIENTE';
    return `ROL ${idRolUsuario}`;
  }
}