import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import {
  ClienteVoucherTipoItem,
  VoucherTipoApi,
} from '../../../../api/voucher-tipo.api';
import {
  VoucherApi,
  VoucherListItem,
} from '../../../../api/voucher.api';
import {
  MovimientosApi,
  MovimientoPuntosItem,
} from '../../../../api/movimientos.api';

interface AccesoRapidoVm {
  titulo: string;
  descripcion: string;
  ruta: string;
  variante: 'entregas' | 'desafios' | 'biblioteca' | 'vouchers' | 'perfil';
}

interface ActividadRecienteVm {
  titulo: string;
  detalle: string;
  fecha: string;
  tipo: 'entrega' | 'desafio' | 'voucher' | 'biblioteca';
}

@Component({
  standalone: true,
  selector: 'app-menu-cliente',
  imports: [CommonModule, RouterModule],
  templateUrl: './menu-cliente.component.html',
  styleUrls: ['./menu-cliente.component.scss'],
})
export class MenuClienteComponent {
  private router = inject(Router);
  private voucherTipoApi = inject(VoucherTipoApi);
  private voucherApi = inject(VoucherApi);
  private movimientosApi = inject(MovimientosApi);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  error: string | null = null;

  nombreCliente = 'Bienvenido/a';

  puntosDisponibles = 0;
  vouchersAdquiridos = 0;
  vouchersUtilizados = 0;
  vouchersAnulados = 0;
  cantidadTiposDisponibles = 0;

  proximaMeta = {
    titulo: 'Todavía no hay vouchers disponibles para canje',
    descripcion: 'Cuando tengas puntos suficientes, aquí verás tu próxima oportunidad de canje.',
    puntosFaltantes: 0,
  };

  accesosRapidos: AccesoRapidoVm[] = [
    {
      titulo: 'Mis entregas',
      descripcion: 'Registrá, consultá y seguí el estado de tus entregas reciclables.',
      ruta: '/menu-principal/cliente/entregas',
      variante: 'entregas',
    },
    {
      titulo: 'Desafíos',
      descripcion: 'Explorá desafíos activos, inscribete y participá para sumar puntos.',
      ruta: '/menu-principal/cliente/desafios',
      variante: 'desafios',
    },
    {
      titulo: 'Biblioteca',
      descripcion: 'Accedé a contenidos educativos, materiales informativos y encuestas para que sigamos mejorando este espacio.',
      ruta: '/menu-principal/cliente/biblioteca',
      variante: 'biblioteca',
    },
    {
      titulo: 'Vouchers',
      descripcion: 'Consultá por vouchers disponibles y canjeá tus puntos por beneficios.',
      ruta: '/menu-principal/cliente/vouchers',
      variante: 'vouchers',
    },
    {
      titulo: 'Mi perfil',
      descripcion: 'Revisá tus datos personales y la información de tu cuenta.',
      ruta: '/menu-principal/perfil',
      variante: 'perfil',
    },
  ];

  actividadReciente: ActividadRecienteVm[] = [];

  constructor() {
    this.cargarInicioCliente();
  }

  cargarInicioCliente(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      tiposDisponibles: this.voucherTipoApi.getDisponiblesCliente({
        limit: 10,
        offset: 0,
        sortBy: 'puntosRequeridos',
        order: 'asc',
      }),
      vouchers: this.voucherApi.list({
        limit: 20,
        offset: 0,
        sortBy: 'fechaAdquisicion',
        order: 'desc',
      }),
      movimientos: this.movimientosApi.list({
        limit: 20,
        offset: 0,
        sortBy: 'fecha',
        order: 'desc',
      }),
    }).subscribe({
      next: ({ tiposDisponibles, vouchers, movimientos }) => {
        this.puntosDisponibles = Number(tiposDisponibles?.puntosDisponibles ?? 0);
        this.cantidadTiposDisponibles = Number(tiposDisponibles?.items?.length ?? 0);

        const vouchersItems = (vouchers?.items ?? []) as VoucherListItem[];

        this.vouchersAdquiridos = vouchersItems.filter(v => Number(v.estadoVoucher) === 2).length;
        this.vouchersUtilizados = vouchersItems.filter(v => Number(v.estadoVoucher) === 3).length;
        this.vouchersAnulados = vouchersItems.filter(v => Number(v.estadoVoucher) === 4).length;

        const tipos = (tiposDisponibles?.items ?? []) as ClienteVoucherTipoItem[];

        const recomendado =
          tipos.find(t => !!t.disponibleParaCanje) ??
          tipos[0] ??
          null;

        if (recomendado) {
          this.proximaMeta = {
            titulo: recomendado.disponibleParaCanje
              ? `Ya podés canjear: ${recomendado.titulo}`
              : `Te acercás a: ${recomendado.titulo}`,
            descripcion: recomendado.descripcion,
            puntosFaltantes: Number(recomendado.puntosFaltantes ?? 0),
          };
        } else {
          this.proximaMeta = {
            titulo: 'Todavía no hay vouchers disponibles para canje',
            descripcion: 'Cuando existan beneficios vigentes, los vas a ver reflejados aquí.',
            puntosFaltantes: 0,
          };
        }

        const actividadDesdeVouchers: ActividadRecienteVm[] = vouchersItems.slice(0, 3).map((item) => ({
          titulo:
            Number(item.estadoVoucher) === 4
              ? 'Voucher anulado'
              : Number(item.estadoVoucher) === 3
                ? 'Voucher utilizado'
                : 'Voucher adquirido',
          detalle: item.voucherTipo?.titulo
            ? `Movimiento asociado a ${item.voucherTipo.titulo}.`
            : `Movimiento asociado al voucher #${item.idVoucher}.`,
          fecha: item.fechaUso ?? item.fechaAdquisicion,
          tipo: 'voucher',
        }));

        const actividadDesdeMovimientos: ActividadRecienteVm[] = ((movimientos?.items ?? []) as MovimientoPuntosItem[])
          .slice(0, 4)
          .map((item) => ({
            titulo:
              item.origen === 1
                ? 'Movimiento por entrega'
                : item.origen === 2
                  ? 'Movimiento por voucher'
                  : 'Movimiento de ajuste',
            detalle: item.descripcion ?? 'Se registró un movimiento en tu cuenta.',
            fecha: item.fecha,
            tipo:
              item.origen === 1
                ? 'entrega'
                : item.origen === 2
                  ? 'voucher'
                  : 'biblioteca',
          }));

        this.actividadReciente = [...actividadDesdeVouchers, ...actividadDesdeMovimientos]
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .slice(0, 5);

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[MenuCliente] Error cargando inicio cliente', err);
        this.error = err?.error?.message ?? 'No se pudo cargar la información inicial.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  irA(ruta: string): void {
    this.router.navigate([ruta]);
  }

  getVarianteAccesoClase(variante: AccesoRapidoVm['variante']): string {
    return `quick-card quick-card--${variante}`;
  }

  getActividadClase(tipo: ActividadRecienteVm['tipo']): string {
    return `activity-badge activity-badge--${tipo}`;
  }

  trackByTitulo(_: number, item: AccesoRapidoVm | ActividadRecienteVm): string {
    return item.titulo;
  }
}
