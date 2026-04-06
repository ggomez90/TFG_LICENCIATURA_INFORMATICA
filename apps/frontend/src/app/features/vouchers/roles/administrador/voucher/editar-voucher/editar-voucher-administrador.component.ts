import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

type BackTo = 'dashboard' | 'listar';

interface EditarVoucherForm {
  idCliente: number | null;
  idVoucherTipo: number | null;
  estadoVoucher: number;      // 1..4 (campo real del model)
  fechaAdquisicion: string;   // yyyy-MM-dd (se muestra pero NO editable)
}

@Component({
  standalone: true,
  selector: 'app-editar-voucher-adm',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-voucher-administrador.component.html',
  styleUrls: ['./editar-voucher-administrador.component.scss'],
})
export class EditarVoucherAdministradorComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  backTo: BackTo = 'dashboard';
  idVoucher = 0;

  // estados catálogo
  readonly ESTADO = { CREADO: 1, ADQUIRIDO: 2, UTILIZADO: 3, ANULADO: 4 } as const;
  estados = [
    { value: 1, label: 'Creado' },
    { value: 2, label: 'Adquirido' },
    { value: 3, label: 'Utilizado' },
    { value: 4, label: 'Anulado' },
  ];

  form: EditarVoucherForm = this.emptyForm();
  original: EditarVoucherForm = this.emptyForm();

  // switch
  cambiarEstado = false;

  loading = false;
  errorMsg: string | null = null;

  ngOnInit(): void {
    const state = history.state ?? {};
    this.backTo = state?.backTo === 'listar' ? 'listar' : 'dashboard';

    this.idVoucher = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    if (!this.idVoucher || this.idVoucher <= 0) {
      alert('ID voucher no válido.');
      this.onVolver();
      return;
    }

    this.cargarVoucher(this.idVoucher);
  }

  private cargarVoucher(id: number): void {
    this.loading = true;
    this.http.get<any>(`/api/vouchers/${id}`).subscribe({
      next: (v: any) => {
        // v.fechaAdquisicion viene ISO, la llevamos a yyyy-MM-dd
        const ymd = this.isoToYmd(v?.fechaAdquisicion);

        this.form = {
          idCliente: this.coerceIntOrNull(v?.idCliente),
          idVoucherTipo: this.coerceIntOrNull(v?.idVoucherTipo),
          estadoVoucher: this.coerceInt(v?.estadoVoucher, this.ESTADO.ADQUIRIDO),
          fechaAdquisicion: ymd ?? this.todayYmd(),
        };

        this.original = { ...this.form };
        this.cambiarEstado = false; // siempre off al entrar
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('Error cargando voucher', err);
        alert(err?.error?.message ?? 'No se pudo cargar el voucher.');
        this.onVolver();
      },
      complete: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onToggleCambiarEstado(): void {
    // si apaga el switch, volvemos al estado original
    if (!this.cambiarEstado) {
      this.form.estadoVoucher = this.original.estadoVoucher;
    }
  }

  onVolver(): void {
    if (this.backTo === 'listar') {
      this.router.navigate(['/menu-principal/admin/vouchers/voucher-tipo/listar']);
    } else {
      this.router.navigate(['/menu-principal/admin/vouchers']);
    }
  }

  onLimpiar(): void {
    this.form = { ...this.original };
    this.cambiarEstado = false;
  }

  onPrevisualizar(): void {
    const err = this.validate();
    if (err) {
      alert(err);
      return;
    }

    this.router.navigate(
      ['/menu-principal/admin/vouchers/voucher/preview'],
      {
        state: {
          mode: 'edit',
          idVoucherEdit: this.idVoucher,
          cambiarEstado: this.cambiarEstado,

          borrador: {
            idCliente: this.form.idCliente,
            idVoucherTipo: this.form.idVoucherTipo,
            estadoVoucher: this.form.estadoVoucher,
            fechaAdquisicion: this.form.fechaAdquisicion,
          },

          from: 'dashboard',
        }
      }
    );
  }


  onActualizar(): void {
    const err = this.validate();
    if (err) { alert(err); return; }

    const payloadUpdate: any = {
      idCliente: this.coerceInt(this.form.idCliente, 0),
      idVoucherTipo: this.coerceInt(this.form.idVoucherTipo, 0),
    };

    const estadoNuevo = this.coerceInt(this.form.estadoVoucher, this.ESTADO.ADQUIRIDO);
    const estadoOriginal = this.coerceInt(this.original.estadoVoucher, this.ESTADO.ADQUIRIDO);

    this.loading = true; this.errorMsg = null; this.cdr.markForCheck();

    const reqUpdate$ = this.http.patch<any>(`/api/vouchers/${this.idVoucher}`, payloadUpdate);

    // Si switch ON y cambió el estado, pegamos al /estado
    const debeCambiarEstado = this.cambiarEstado && (estadoNuevo !== estadoOriginal);
    const reqEstado$ = debeCambiarEstado
      ? this.http.patch<any>(`/api/vouchers/${this.idVoucher}/estado`, { idEstadoVoucher: estadoNuevo })
      : of(null);

    forkJoin([reqUpdate$, reqEstado$]).subscribe({
      next: () => {
        alert('Voucher actualizado correctamente.');
        this.router.navigate(['/menu-principal/admin/vouchers'], { queryParams: { t: Date.now() } });
      },
      error: (err2: any) => {
        console.error('Error actualizando voucher', err2);
        alert(err2?.error?.message ?? 'No se pudo actualizar el voucher.');
      },
      complete: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Helpers
  private emptyForm(): EditarVoucherForm {
    return {
      idCliente: null,
      idVoucherTipo: null,
      estadoVoucher: this.ESTADO.ADQUIRIDO,
      fechaAdquisicion: this.todayYmd(),
    };
  }

  todayYmd(): string {
    return new Date().toISOString().slice(0, 10);
  }

  onNumberKeydown(event: KeyboardEvent) {
    const invalid = ['.', ',', '-', 'e', '+'];
    if (invalid.includes(event.key)) event.preventDefault();
  }

  private coerceInt(value: any, fallback: number): number {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  }

  private coerceIntOrNull(value: any): number | null {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  }

  private isoToYmd(iso?: string | null): string | null {
    if (!iso) return null;
    // ISO a yyyy-MM-dd
    try { return new Date(iso).toISOString().slice(0, 10); } catch { return null; }
  }

  private validate(): string | null {
    const f = this.form;

    if (!Number.isInteger(f.idCliente) || (f.idCliente ?? 0) <= 0) {
      return 'Debés indicar un ID de cliente válido (entero > 0).';
    }
    if (!Number.isInteger(f.idVoucherTipo) || (f.idVoucherTipo ?? 0) <= 0) {
      return 'Debés indicar un Tipo de voucher válido (entero > 0).';
    }

    if (this.cambiarEstado) {
      const ev = Number(f.estadoVoucher);
      if (![1, 2, 3, 4].includes(ev)) return 'Estado inválido.';
    }

    // fechaAdquisicion no se edita, pero debe existir para preview
    if (!f.fechaAdquisicion) {
      return 'La fecha de adquisición no es válida.';
    }

    return null;
  }
}
