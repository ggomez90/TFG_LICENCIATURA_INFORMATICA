import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoucherTipoApi } from '../../../../../../api/voucher-tipo.api';
import { VoucherApi } from '../../../../../../api/voucher.api';
import { take, finalize } from 'rxjs/operators';

interface VoucherTipoForm {
  titulo: string;
  descripcion: string;
  puntosRequeridos: number | null;
  montoBeneficio: number | null;
  fechaInicioVigencia: string; // yyyy-MM-dd
  fechaFinVigencia: string;    // yyyy-MM-dd
  activa: boolean;
}

@Component({
  selector: 'app-editar-voucher-tipo-administrador',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-voucher-tipo-administrador.component.html',
  styleUrls: ['./editar-voucher-tipo-administrador.component.scss'],
})
export class EditarVoucherTipoAdministradorComponent implements OnInit {
  id!: number;
  form: VoucherTipoForm = this.emptyForm();
  original!: VoucherTipoForm;
  loading = false;
  edicionBloqueada = false;
  disableCampos = false;
  error: string | null = null;
  private backTo: 'dashboard' | 'listar' = 'dashboard';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly voucherTipoApi: VoucherTipoApi,
    private readonly cdr: ChangeDetectorRef,
    private readonly voucherApi: VoucherApi,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      alert('ID inválido.');
      this.onVolver();
      return;
    }
    // >>> ESTE ERA EL FALTANTE CLAVE <<<
    this.id = id;
    this.backTo = (history.state?.backTo === 'listar') ? 'listar' : 'dashboard';

    // Chequear si tiene vouchers emitidos
    this.voucherApi.existsForTipo(id).pipe(take(1)).subscribe({
      next: (resp) => {
        if (resp?.exists) {
          alert('Este tipo de voucher ya tiene vouchers emitidos y no puede editarse.');
          this.onVolver();
          return;
        }
        // Si NO tiene vouchers → cargar datos del tipo
        this.cargar(id);
      },
      error: () => {
        alert('No se pudo verificar si el tipo tiene vouchers emitidos.');
        this.onVolver();
      }
    });
  }

  private cargar(id: number): void {
    this.loading = true;
    this.voucherTipoApi.getById(id).pipe(take(1), finalize(() => {
      this.loading = false;
    })).subscribe({
      next: (raw: any) => {
        const toYmd = (iso?: string | null) => {
          if (!iso) return '';
          const d = new Date(iso);
          return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
        };

        // Seteamos TODO el form en un solo paso y forzamos CD
        this.form = {
          titulo: raw?.titulo ?? '',
          descripcion: raw?.descripcion ?? '',
          puntosRequeridos: Number(raw?.puntosRequeridos ?? 0) || null,
          montoBeneficio: Number(raw?.montoBeneficio ?? 0) || null,
          fechaInicioVigencia: toYmd(raw?.fechaInicioVigencia),
          fechaFinVigencia: toYmd(raw?.fechaFinVigencia),
          activa: Boolean(raw?.activa),
        };
        this.original = { ...this.form };

        // Forzar render (caso de plantillas con ngModel en inputs)
        this.cdr.detectChanges();
        // parche extra por si hay zonas fuera de Angular
        setTimeout(() => this.cdr.detectChanges(), 0);
      },
      error: (err) => {
        console.error('Error cargando tipo de voucher', err);
        alert('No se pudo cargar el tipo de voucher.');
        this.onVolver();
      },
    });
  }

  // ===== Navegación / Acciones
  onVolver(): void {
    if (this.backTo === 'listar') {
      this.router.navigate(['/menu-principal/admin/vouchers/voucher-tipo/listar']);
    } else {
      this.router.navigate(['menu-principal/admin/vouchers']);
    }
  }

  onRestablecer(): void {
    if (this.original) this.form = { ...this.original };
  }

  onPrevisualizar(): void {
    const error = this.validate();
    if (error) { alert(error); return; }

    this.router.navigate(
      ['menu-principal/admin/vouchers/voucher-tipo/preview'],
      {
        state: {
          borrador: this.form,
          mode: 'edit',
          idVoucherTipo: this.id,
          backTo: this.backTo
        }
      }
    );
  }

  onActualizar(): void {
    const error = this.validate();
    if (error) { alert(error); return; }

    const payload = {
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion.trim(),
      puntosRequeridos: Number(this.form.puntosRequeridos),
      montoBeneficio: Number(this.form.montoBeneficio),
      fechaInicioVigencia: this.toIsoDate(this.form.fechaInicioVigencia),
      fechaFinVigencia: this.toIsoDate(this.form.fechaFinVigencia),
      activa: Boolean(this.form.activa),
    };

    this.voucherTipoApi.update(this.id, payload).subscribe({
      next: () => {
        alert('Tipo de voucher actualizado correctamente.');
        if (this.backTo === 'listar') {
          this.router.navigate(
            ['/menu-principal/admin/vouchers/voucher-tipo/listar'],
            { queryParams: { t: Date.now() } }
          );
        } else {
          this.router.navigate(
            ['menu-principal/admin/vouchers'],
            { queryParams: { t: Date.now() } }
          );
        }
      },
      error: (err) => {
        console.error('Error actualizando tipo de voucher', 'status=', err?.status, 'body=', err?.error);
        alert(err?.error?.message ?? 'Ocurrió un error al actualizar el tipo de voucher.');
      },
    });
  }

  // ===== Helpers
  minFechaInicio(): string {
    const hoy = new Date();
    return hoy.toISOString().slice(0, 10);
  }
  getMinFechaFin(): string {
    return this.form.fechaInicioVigencia || this.minFechaInicio();
  }

  private emptyForm(): VoucherTipoForm {
    return {
      titulo: '',
      descripcion: '',
      puntosRequeridos: null,
      montoBeneficio: null,
      fechaInicioVigencia: '',
      fechaFinVigencia: '',
      activa: true,
    };
  }

  private toIsoDate(dateYMD: string): string {
    if (!dateYMD) return '';
    const d = new Date(`${dateYMD}T00:00:00`);
    return d.toISOString();
  }

  onNumberKeydown(event: KeyboardEvent) {
    const invalidKeys = ['.', ',', '-', 'e', '+'];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  private ymd(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  minFechaFinEditar(): string {
    const today = new Date();
    today.setDate(today.getDate() + 1); // mañana
    return this.ymd(today);
  }

  private validate(): string | null {
    const f = this.form;
    if (!f.titulo?.trim()) return 'El título es obligatorio.';
    if (!f.descripcion?.trim()) return 'La descripción es obligatoria.';

    const puntos = Number(f.puntosRequeridos);
    if (!Number.isInteger(puntos) || puntos <= 0) return 'Puntos requeridos debe ser un entero mayor a 0.';

    const monto = Number(f.montoBeneficio);
    if (!Number.isInteger(monto) || monto <= 0) return 'Monto del beneficio debe ser un entero mayor a 0.';

    if (!f.fechaInicioVigencia) return 'La fecha de inicio está ausente.';
    if (!f.fechaFinVigencia) return 'La fecha de fin es obligatoria.';

    // Fecha fin >= mañana
    const fin = new Date(f.fechaFinVigencia);
    const min = new Date(this.minFechaFinEditar());
    if (isNaN(fin.getTime())) return 'La fecha de fin no es válida.';
    if (fin < min) return 'La fecha de fin debe ser al menos mañana.';

    return null;
  }
}
