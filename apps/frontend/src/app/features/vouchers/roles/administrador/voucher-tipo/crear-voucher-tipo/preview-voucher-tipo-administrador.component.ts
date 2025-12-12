import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { VoucherTipoApi } from '../../../../../../api/voucher-tipo.api';
import { UserSessionService } from '../../../../../../auth/user-session.service';

type PreviewMode = 'create' | 'edit';

interface PreviewData {
  idVoucherTipo?: number;
  titulo: string;
  descripcion: string;
  puntosRequeridos: number;
  montoBeneficio: number;
  fechaInicioVigencia: string;     // ISO o yyyy-MM-dd
  fechaFinVigencia: string | null; // ISO o yyyy-MM-dd o null
  activa: boolean;
}

@Component({
  standalone: true,
  selector: 'app-preview-voucher-tipo-adm',
  imports: [CommonModule, RouterModule],
  templateUrl: './preview-voucher-tipo-administrador.component.html',
  styleUrls: ['./preview-voucher-tipo-administrador.component.scss'],
})
export class PreviewVoucherTipoAdministradorComponent implements OnInit {
  private router = inject(Router);
  private api = inject(VoucherTipoApi);
  private cdr = inject(ChangeDetectorRef);
  private session = inject(UserSessionService);
  private backTo: 'dashboard' | 'listar' = 'dashboard';


  mode: PreviewMode = 'create';
  idEdit?: number;
  data!: PreviewData;

  ngOnInit(): void {
    const state = history.state ?? {};
    const stateMode = String(state?.mode ?? '').toLowerCase();
    const stateId   = Number(state?.idVoucherTipo);

    if (stateMode === 'edit' && Number.isFinite(stateId) && stateId > 0) {
      this.mode = 'edit';
      this.idEdit = stateId;
    } else {
      this.mode = 'create';
      this.idEdit = undefined;
    }

    this.backTo = (state?.backTo === 'listar') ? 'listar' : 'dashboard';

    const borrador = state.borrador as Partial<PreviewData> | undefined;
    this.data = {
      idVoucherTipo: this.idEdit,
      titulo: borrador?.titulo ?? '',
      descripcion: borrador?.descripcion ?? '',
      puntosRequeridos: Number(borrador?.puntosRequeridos ?? 0),
      montoBeneficio: Number(borrador?.montoBeneficio ?? 0),
      fechaInicioVigencia: borrador?.fechaInicioVigencia ?? '',
      fechaFinVigencia: borrador?.fechaFinVigencia ?? null,
      activa: Boolean(borrador?.activa),
    };

    // Evita el “solo aparece al hacer click”
    Promise.resolve().then(() => this.cdr.detectChanges());
  }

  private toIso(dateYMDorISO?: string | null): string | undefined {
    if (!dateYMDorISO) return undefined;
    // yyyy-MM-dd -> ISO UTC
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateYMDorISO)) {
      const d = new Date(`${dateYMDorISO}T00:00:00`);
      return d.toISOString();
    }
    // Ya era ISO
    return dateYMDorISO;
  }

  onVolver(): void {
    if (this.mode === 'edit' && this.idEdit) {
      // Volver al editor conservando el origen para que el editor también sepa volver bien
      this.router.navigate(
        ['menu-principal/admin/vouchers/voucher-tipo/editar', this.idEdit],
        { state: { backTo: this.backTo } }
      );
    } else {
      // Volver a crear (no cambia)
      this.router.navigate(['menu-principal/admin/vouchers/voucher-tipo/crear']);
    }
  }


  async onGuardarOActualizar(): Promise<void> {
    if (this.mode === 'edit' && (!this.idEdit || !Number.isFinite(this.idEdit))) {
      alert('No se pudo determinar el ID a actualizar. Volviendo al editor.');
      this.onVolver();
      return;
    }

    const payloadBase = {
      titulo: this.data.titulo.trim(),
      descripcion: this.data.descripcion.trim(),
      puntosRequeridos: Number(this.data.puntosRequeridos),
      montoBeneficio: Number(this.data.montoBeneficio),
      fechaInicioVigencia: this.toIso(this.data.fechaInicioVigencia),
      fechaFinVigencia: this.toIso(this.data.fechaFinVigencia),
      activa: Boolean(this.data.activa),
    };

    if (this.mode === 'edit' && this.idEdit) {
      // PATCH (editar)
      this.api.update(this.idEdit, payloadBase).subscribe({
        next: () => {
          alert('Tipo de voucher actualizado correctamente.');
          if (this.backTo === 'listar') {
            this.router.navigate(
              ['menu-principal/admin/vouchers/voucher-tipo/listar'],
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
          console.error('Error actualizando (preview)', err);
          alert(err?.error?.message ?? 'No se pudo actualizar el tipo de voucher.');
        },
      });
      return;
    }

    // POST (crear) — incluimos idAdmin como en el crear-tipo
    let idAdmin = this.session.getIdUsuario();
    if (!idAdmin) {
      try {
        await this.session.load();
      } catch {}
      idAdmin = this.session.getIdUsuario();
    }
    if (!idAdmin) {
      alert('No se pudo determinar el administrador autenticado.');
      return;
    }

    const payloadCreate = {
      idAdmin,
      ...payloadBase,
    };

    this.api.create(payloadCreate).subscribe({
      next: () => {
        alert('Tipo de voucher creado correctamente.');
        if (this.backTo === 'listar') {
          this.router.navigate(
            ['menu-principal/admin/vouchers/voucher-tipo/listar'],
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
        console.error('Error creando (preview)', err);
        alert(err?.error?.message ?? 'No se pudo crear el tipo de voucher.');
      },
    });
  }

  // helpers visuales
  get isEditMode(): boolean { return this.mode === 'edit'; }
}
