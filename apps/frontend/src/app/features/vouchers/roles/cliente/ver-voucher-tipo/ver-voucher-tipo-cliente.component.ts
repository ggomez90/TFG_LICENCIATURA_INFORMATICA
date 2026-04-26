import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { VoucherTipoApi } from '../../../../../api/voucher-tipo.api';

type ViewData = {
  idVoucherTipo: number;
  titulo: string;
  descripcion: string;
  puntosRequeridos: number;
  montoBeneficio: number;
  fechaInicioVigencia: string;
  fechaFinVigencia: string | null;
  activa: boolean;
};

@Component({
  selector: 'app-ver-voucher-tipo-cliente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ver-voucher-tipo-cliente.component.html',
  styleUrls: ['./ver-voucher-tipo-cliente.component.scss'],
})
export class VerVoucherTipoClienteComponent implements OnInit {
  data: ViewData | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly voucherTipoApi: VoucherTipoApi,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id || Number.isNaN(id)) {
      this.error = 'Identificador inválido.';
      this.loading = false;
      return;
    }

    this.cargar(id);
  }

  private cargar(id: number): void {
    this.loading = true;
    this.error = null;

    this.voucherTipoApi.getById(id).subscribe({
      next: (raw: any) => {
        this.data = {
          idVoucherTipo: raw.idVoucherTipo,
          titulo: raw.titulo ?? '',
          descripcion: raw.descripcion ?? '',
          puntosRequeridos: Number(raw.puntosRequeridos ?? 0),
          montoBeneficio: Number(raw.montoBeneficio ?? 0),
          fechaInicioVigencia: raw.fechaInicioVigencia ?? '',
          fechaFinVigencia: raw.fechaFinVigencia ?? null,
          activa: Boolean(raw.activa),
        };

        this.loading = false;
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('[VerVoucherTipoCliente] Error cargando voucher tipo', err);
        this.error = 'No se pudo cargar el tipo de voucher.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onVolver(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/disponibles']);
  }

  fmtDate(iso?: string | null): string {
    if (!iso) return '—';

    const d = new Date(iso);

    if (Number.isNaN(d.getTime())) {
      return '—';
    }

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();

    return `${dd}/${mm}/${yyyy}`;
  }

  fmtARS(n?: number | null): string {
    const v = Number(n ?? 0);

    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0,
    }).format(v);
  }
}