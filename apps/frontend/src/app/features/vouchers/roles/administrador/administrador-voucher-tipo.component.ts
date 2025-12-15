import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { map, distinctUntilChanged } from 'rxjs/operators';

// APIs
import { VoucherTipoApi, FilterVoucherTipo } from '../../../../api/voucher-tipo.api';
import { VoucherApi } from '../../../../api/voucher.api';

//Tipos locales mínimos para render
interface AdminVoucherTipoListItem {
  idVoucherTipo: number;
  titulo: string;
  fechaInicioVigencia: string; // ISO
  fechaFinVigencia: string;    // ISO
  activa: boolean;
  puntosRequeridos?: number;
  montoBeneficio?: number;
}

type EstadoVoucherCode = 1 | 2 | 3 | 4; // 1 CREADO, 2 ADQUIRIDO, 3 UTILIZADO, 4 ANULADO

interface AdminVoucherListItem {
  idVoucher: number;
  idVoucherTipo: number;
  tituloTipo: string;
  estadoVoucher: EstadoVoucherCode;   // 1,2,3,4
  fechaAdquisicion: string;           // ISO
  fechaUso?: string | null;           // ISO o null
}

@Component({
  selector: 'app-admin-vouchers',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './administrador-voucher-tipo.component.html',
  styleUrls: ['./administrador-voucher-tipo.component.scss'],
})
export class AdministradorVouchersComponent implements OnInit {
  constructor(
    private readonly voucherTipoApi: VoucherTipoApi,
    private readonly voucherApi: VoucherApi,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  // Estado interno
  private _tipos: AdminVoucherTipoListItem[] = [];
  private _vouchers: AdminVoucherListItem[] = [];

  // Flags de loading
  private _loadingTipos = false;
  private _loadingVouchers = false;
  private _onceTipos = false;
  private _onceVouchers = false;

  ngOnInit(): void {
    // Carga inicial
    this.cargarTipos();
    this.cargarVouchers();

    // Si vuelve con ?t=..., refrescar SOLO cuando cambie
    this.route.queryParamMap
      .pipe(
        map(pm => pm.get('t') ?? ''),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.cargarTipos();
        this.cargarVouchers();
      });
  }

  // GETTERS usados por el HTML
  tipos(): AdminVoucherTipoListItem[] { return this._tipos; }
  vouchers(): AdminVoucherListItem[] { return this._vouchers; }
  loadingTipos(): boolean { return this._loadingTipos; }
  loadingVouchers(): boolean { return this._loadingVouchers; }

  //Helpers
  private fmtDate(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  // Acciones Tipos
  onVerMasTipos(): void { this.router.navigate(['/menu-principal/admin/vouchers/voucher-tipo/listar']); }
  onCrearTipo(): void { this.router.navigate(['/menu-principal/admin/vouchers/voucher-tipo/crear']); }
  
  onVerTipo(t: AdminVoucherTipoListItem): void {
    this.router.navigate(
      ['/menu-principal/admin/vouchers/voucher-tipo/ver', t.idVoucherTipo],
      { state: { backTo: 'dashboard' } }
    );
  }

  onEditarTipo(t: AdminVoucherTipoListItem): void {
    this.voucherApi.existsForTipo(t.idVoucherTipo).subscribe({
      next: (r) => {
        if (r?.exists) {
          alert('Este tipo de voucher ya tiene vouchers emitidos. No se puede editar.');
          return;
        }
        this.router.navigate(
          ['/menu-principal/admin/vouchers/voucher-tipo/editar', t.idVoucherTipo],
          { state: { backTo: 'dashboard' } }
        );
      },
      error: () => {
        alert('No se pudo verificar si el tipo tiene vouchers emitidos. Intentalo de nuevo.');
      }
    });
  }

  onToggleActivaTipoConfirm(t: AdminVoucherTipoListItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const nuevoEstado = input.checked;

    const msg = nuevoEstado
      ? '¿Querés activar este tipo de voucher?'
      : '¿Querés desactivar este tipo de voucher? No estará disponible.';
    const ok = window.confirm(msg);
    if (!ok) {
      input.checked = t.activa;
      return;
    }

    // UI
    const estadoPrevio = t.activa;
    t.activa = nuevoEstado;
    // Clonar array para disparar ChangeDetection
    this._tipos = this._tipos.map(x =>
      x.idVoucherTipo === t.idVoucherTipo ? { ...x, activa: nuevoEstado } : x
    );
    this.cdr.markForCheck();

    // PATCH real
    this.voucherTipoApi.updateActiva(t.idVoucherTipo, nuevoEstado).subscribe({
      next: () => {
        // ver con back por si hubo cambios
        setTimeout(() => {
          this.cargarTipos();
          this.cdr.detectChanges();
        }, 0);
      },
      error: (err) => {
        console.error('Error al actualizar activa de tipo', err);
        alert('No se pudo cambiar el estado. Se revertirá el valor anterior.');

        // Revertir UI
        t.activa = estadoPrevio;
        this._tipos = this._tipos.map(x =>
          x.idVoucherTipo === t.idVoucherTipo ? { ...x, activa: estadoPrevio } : x
        );
        input.checked = estadoPrevio;
        this.cdr.detectChanges();
      }
    });
  }


  //Acciones Vouchers
  onVerMasVouchers(): void { this.router.navigate(['/admin/vouchers/voucher/listar']); }
  onCrearVoucher(): void { this.router.navigate(['/admin/vouchers/voucher/crear']); }
  onVerVoucher(v: AdminVoucherListItem): void { this.router.navigate(['/admin/vouchers/voucher/ver', v.idVoucher]); }
  onEditarVoucher(v: AdminVoucherListItem): void { this.router.navigate(['/admin/vouchers/voucher/editar', v.idVoucher]); }

  //Carga Tipos (últimos 10 por ID desc)
  private cargarTipos(): void {
    if (this._onceTipos) return;
    this._onceTipos = true;
    this._loadingTipos = true; this.cdr.markForCheck();

    // sin filtros para no chocar con validaciones del DTO
    const params: any = { limit: 50, offset: 0 };

    this.voucherTipoApi.getAll(params).subscribe({
      next: (resp: any) => {
        const src = Array.isArray(resp?.items) ? resp.items : (Array.isArray(resp) ? resp : []);

        const list = src.map((raw: any) => ({
          idVoucherTipo: raw.idVoucherTipo,
          titulo: raw.titulo,
          fechaInicioVigencia: raw.fechaInicioVigencia,
          fechaFinVigencia: raw.fechaFinVigencia,
          activa: Boolean(raw.activa),
          puntosRequeridos: raw.puntosRequeridos,
          montoBeneficio: raw.montoBeneficio,
        })) as AdminVoucherTipoListItem[];

        // Orden por ID desc y nos quedamos con los 10 más altos
        this._tipos = list
          .sort((a, b) => (b.idVoucherTipo || 0) - (a.idVoucherTipo || 0))
          .slice(0, 10);

        this._loadingTipos = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        // debug para consola
        console.error('GET /api/voucher-tipo falló:', err?.status, err?.error || err);
        this._tipos = [];
        this._loadingTipos = false;
        this.cdr.markForCheck();
      }
    });
  }


  //Carga Vouchers (últimos 10 por ID desc)
  private cargarVouchers(): void {
    if (this._onceVouchers) return;
    this._onceVouchers = true;
    this._loadingVouchers = true; this.cdr.markForCheck();

    const params = { limit: 50, offset: 0 };

    this.voucherApi.list(params).subscribe({
      next: (resp: any) => {
        const src = Array.isArray(resp?.items) ? resp.items : (Array.isArray(resp) ? resp : []);

        const list = src.map((raw: any) => ({
          idVoucher: raw.idVoucher,
          idVoucherTipo: raw.idVoucherTipo,
          tituloTipo: raw.voucherTipo?.titulo ?? raw.tituloTipo ?? '(Sin título)',
          estadoVoucher: Number(raw.estadoVoucher) as EstadoVoucherCode,
          fechaAdquisicion: raw.fechaAdquisicion,
          fechaUso: raw.fechaUso ?? null,
        })) as AdminVoucherListItem[];

        this._vouchers = list
          .sort((a, b) => (b.idVoucher || 0) - (a.idVoucher || 0))
          .slice(0, 10);

        this._loadingVouchers = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('GET /api/voucher falló:', err?.status, err?.error || err);
        this._vouchers = [];
        this._loadingVouchers = false;
        this.cdr.markForCheck();
      }
    });
  }


  //Formatos usados en el template
  fmtVigencia(i: AdminVoucherTipoListItem): string {
    return `${this.fmtDate(i.fechaInicioVigencia)} – ${this.fmtDate(i.fechaFinVigencia)}`;
  }
  fmtFechaAdq(v: AdminVoucherListItem): string {
    return this.fmtDate(v.fechaAdquisicion);
  }
  badgeClaseVoucher(v: AdminVoucherListItem): 'dsf-badge--ok' | 'dsf-badge--muted' | '' {
    if (v.estadoVoucher === 3) return 'dsf-badge--ok';     // UTILIZADO
    if (v.estadoVoucher === 4) return 'dsf-badge--muted';  // ANULADO
    return '';
  }
}
