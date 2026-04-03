import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificacionApi, NotificacionItem } from '../../api/notificacion.api';

@Component({
  selector: 'app-listar-notificaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './listar-notificaciones.component.html',
  styleUrls: ['./listar-notificaciones.component.scss'],
})
export class ListarNotificacionesComponent implements OnInit {
  private readonly notificacionApi = inject(NotificacionApi);

  readonly pageSize = 20;

  cargando = signal(false);
  error = signal<string | null>(null);
  notificaciones = signal<NotificacionItem[]>([]);
  filtro = signal('');

  total = signal(0);
  paginaActual = signal(1);

  totalPaginas = computed(() => {
    const total = this.total();
    return total > 0 ? Math.ceil(total / this.pageSize) : 1;
  });

  puedeIrAtras = computed(() => this.paginaActual() > 1);
  puedeIrSiguiente = computed(() => this.paginaActual() < this.totalPaginas());

  notificacionesFiltradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    const items = this.notificaciones();

    if (!texto) return items;

    return items.filter((item) => {
      const titulo = (item.titulo ?? '').toLowerCase();
      const mensaje = (item.mensaje ?? '').toLowerCase();
      return titulo.includes(texto) || mensaje.includes(texto);
    });
  });

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.cargando.set(true);
    this.error.set(null);

    const offset = (this.paginaActual() - 1) * this.pageSize;

    this.notificacionApi.getMias({
      limit: this.pageSize,
      offset,
    }).subscribe({
      next: (resp) => {
        this.notificaciones.set(resp.items ?? []);
        this.total.set(resp.total ?? 0);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('[ListarNotificaciones] Error cargando notificaciones', err);
        this.error.set(err?.error?.message ?? 'No se pudieron cargar las notificaciones.');
        this.notificaciones.set([]);
        this.total.set(0);
        this.cargando.set(false);
      },
    });
  }

  actualizarFiltro(value: string): void {
    this.filtro.set(value);
  }

  limpiarFiltro(): void {
    this.filtro.set('');
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
}