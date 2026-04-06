import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VoucherTipoApi } from '../../../../../../api/voucher-tipo.api';
import { UserSessionService } from '../../../../../../auth/user-session.service';

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
  selector: 'app-crear-voucher-tipo-administrador',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './crear-voucher-tipo-administrador.component.html',
  styleUrls: ['./crear-voucher-tipo-administrador.component.scss'],
})
export class CrearVoucherTipoAdministradorComponent implements OnInit {
  form: VoucherTipoForm = this.emptyForm();

  constructor(
    private readonly router: Router,
    private readonly voucherTipoApi: VoucherTipoApi,
    private readonly session: UserSessionService,
  ) {}

  ngOnInit(): void {
    const borrador = history.state?.borrador as VoucherTipoForm | undefined;
    if (borrador) this.form = { ...borrador };
  }

  minFechaInicio(): string {
    const hoy = new Date();
    return hoy.toISOString().slice(0, 10);
  }
  getMinFechaFin(): string {
    return this.form.fechaInicioVigencia || this.minFechaInicio();
  }

  onVolver(): void {
    this.router.navigate(['menu-principal/admin/vouchers']);
  }

  onBorrar(): void {
    this.form = this.emptyForm();
  }

  async onCrear(): Promise<void> {
    const error = this.validate();
    if (error) { alert(error); return; }

    let idAdmin = this.session.getIdUsuario();
    if (!idAdmin) {
      await this.session.load();
      idAdmin = this.session.getIdUsuario();
    }
    if (!idAdmin) {
      alert('No se pudo determinar el administrador autenticado.');
      return;
    }

    const payload = {
      idAdmin,
      titulo: this.form.titulo.trim(),
      descripcion: this.form.descripcion.trim(),
      puntosRequeridos: Number(this.form.puntosRequeridos),
      montoBeneficio: Number(this.form.montoBeneficio),
      fechaInicioVigencia: this.toIsoDate(this.form.fechaInicioVigencia),
      fechaFinVigencia: this.toIsoDate(this.form.fechaFinVigencia),
      activa: Boolean(this.form.activa),
    };

    this.voucherTipoApi.create(payload).subscribe({
      next: () => {
        alert('Tipo de voucher creado correctamente.');
        this.router.navigate(['menu-principal/admin/vouchers'], {
          queryParams: { t: Date.now() }, // fuerza refresco del dashboard
        });
      },
      error: (err) => {
        console.error('Error creando tipo de voucher', 'status=', err?.status, 'body=', err?.error);
        alert(err?.error?.message ?? 'Ocurrió un error al crear el tipo de voucher.');
      },
    });
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

  private validate(): string | null {
    const f = this.form;
    if (!f.titulo?.trim()) return 'El título es obligatorio.';
    if (!f.descripcion?.trim()) return 'La descripción es obligatoria.';

    const puntos = Number(f.puntosRequeridos);
    if (!Number.isInteger(puntos) || puntos <= 0) return 'Puntos requeridos debe ser un entero mayor a 0.';

    const monto = Number(f.montoBeneficio);
    if (!Number.isInteger(monto) || monto <= 0) return 'Monto del beneficio debe ser un entero mayor a 0.';

    if (!f.fechaInicioVigencia) return 'La fecha de inicio de vigencia es obligatoria.';
    if (!f.fechaFinVigencia) return 'La fecha de fin de vigencia es obligatoria.';

    const ini = new Date(f.fechaInicioVigencia);
    const fin = new Date(f.fechaFinVigencia);
    if (fin < ini) return 'La fecha de fin de vigencia debe ser posterior o igual a la fecha de inicio.';

    return null;
  }

  // Restringe a enteros en inputs numéricos
  onNumberKeydown(event: KeyboardEvent) {
    const invalidKeys = ['.', ',', '-', 'e', '+'];
    if (invalidKeys.includes(event.key)) {
      event.preventDefault();
    }
  }

  onPrevisualizar(): void {
    const error = this.validate();
    if (error) { alert(error); return; }
    this.router.navigate(
      ['menu-principal/admin/vouchers/voucher-tipo/preview'],
      { state: { borrador: this.form, mode: 'create' } }
    );
  }
}
