import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  ClienteVoucherTipoItem,
  VoucherTipoApi,
} from '../../../../../api/voucher-tipo.api';
import { VoucherApi } from '../../../../../api/voucher.api';

type EstadoDisponibilidad = 'disponible' | 'faltan-puntos';

interface VoucherTipoClienteVm {
  idVoucherTipo: number;
  titulo: string;
  descripcion: string;
  montoBeneficio: number;
  puntosRequeridos: number;
  fechaInicio: string;
  fechaFin: string;
  activa: boolean;
  estado: EstadoDisponibilidad;
  puntosFaltantes?: number;
}

@Component({
  standalone: true,
  selector: 'app-listar-voucher-tipo-cliente',
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './listar-voucher-tipo-cliente.component.html',
  styleUrls: ['./listar-voucher-tipo-cliente.component.scss'],
})
export class ListarVoucherTipoClienteComponent {
  private router = inject(Router);
  private voucherTipoApi = inject(VoucherTipoApi);
  private voucherApi = inject(VoucherApi);

  loading = false;
  error: string | null = null;

  puntosDisponibles = 0;

  soloDisponibles = signal(false);
  ordenSeleccionado = signal<'puntos-asc' | 'puntos-desc' | 'beneficio-desc'>('puntos-asc');

  vouchers = signal<VoucherTipoClienteVm[]>([]);

  vouchersFiltrados = computed(() => {
    let items = [...this.vouchers()];

    if (this.soloDisponibles()) {
      items = items.filter(x => x.estado === 'disponible');
    }

    switch (this.ordenSeleccionado()) {
      case 'puntos-asc':
        items.sort((a, b) => a.puntosRequeridos - b.puntosRequeridos);
        break;
      case 'puntos-desc':
        items.sort((a, b) => b.puntosRequeridos - a.puntosRequeridos);
        break;
      case 'beneficio-desc':
        items.sort((a, b) => b.montoBeneficio - a.montoBeneficio);
        break;
    }

    return items;
  });

  cantidadDisponibles = computed(() =>
    this.vouchersFiltrados().filter(v => v.estado === 'disponible').length
  );

  cantidadFaltanPuntos = computed(() =>
    this.vouchersFiltrados().filter(v => v.estado === 'faltan-puntos').length
  );

  constructor() {
    this.cargarTiposDisponibles();
  }

  cargarTiposDisponibles(): void {
    this.loading = true;
    this.error = null;

    this.voucherTipoApi.getDisponiblesCliente({
      limit: 100,
      offset: 0,
      sortBy: 'puntosRequeridos',
      order: 'asc',
    }).subscribe({
      next: (resp) => {
        this.puntosDisponibles = Number(resp?.puntosDisponibles ?? 0);

        const items: VoucherTipoClienteVm[] = (resp?.items ?? []).map((item: ClienteVoucherTipoItem) => ({
          idVoucherTipo: item.idVoucherTipo,
          titulo: item.titulo,
          descripcion: item.descripcion,
          montoBeneficio: Number(item.montoBeneficio ?? 0),
          puntosRequeridos: Number(item.puntosRequeridos ?? 0),
          fechaInicio: item.fechaInicioVigencia,
          fechaFin: item.fechaFinVigencia,
          activa: !!item.activa,
          estado: item.disponibleParaCanje ? 'disponible' : 'faltan-puntos',
          puntosFaltantes: Number(item.puntosFaltantes ?? 0),
        }));

        this.vouchers.set(items);
        this.loading = false;
      },
      error: (err) => {
        console.error('[ListarVoucherTipoCliente] Error cargando tipos', err);
        this.error = err?.error?.message ?? 'No se pudieron cargar los vouchers disponibles.';
        this.loading = false;
      }
    });
  }

  irAlDashboard(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers']);
  }

  verMisVouchers(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/mis-vouchers']);
  }

  adquirirVoucherTipo(idVoucherTipo: number): void {
    this.voucherApi.adquirirCliente({ idVoucherTipo }).subscribe({
      next: () => {
        this.cargarTiposDisponibles();
        this.verMisVouchers();
      },
      error: (err) => {
        console.error('[ListarVoucherTipoCliente] Error adquiriendo voucher', err);
        this.error = err?.error?.message ?? 'No se pudo adquirir el voucher.';
      }
    });
  }

  verDetalleTipo(idVoucherTipo: number): void {
    console.log('Detalle tipo voucher cliente', idVoucherTipo);
  }

  getEstadoLabel(estado: EstadoDisponibilidad): string {
    return estado === 'disponible' ? 'Disponible' : 'No alcanzan tus puntos';
  }

  getEstadoClase(estado: EstadoDisponibilidad): string {
    return estado === 'disponible' ? 'chip chip--ok' : 'chip chip--warn';
  }

  trackById(_: number, item: VoucherTipoClienteVm): number {
    return item.idVoucherTipo;
  }
}