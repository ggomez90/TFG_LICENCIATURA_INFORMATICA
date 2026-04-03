import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

type PreviewFrom = 'dashboard' | 'listar-tipo-voucher' | string | undefined;

interface PreviewBorrador {
  idCliente: number;
  idVoucherTipo: number;
  idEstadoVoucher: number;
  fechaAdquisicion: string; // yyyy-MM-dd
}

@Component({
  standalone: true,
  selector: 'app-preview-voucher-adm',
  imports: [CommonModule, RouterModule],
  templateUrl: './preview-voucher-administrador.component.html',
  styleUrls: ['./preview-voucher-administrador.component.scss'],
})
export class PreviewVoucherAdministradorComponent implements OnInit {
  private router = inject(Router);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  from: PreviewFrom = 'dashboard';
  borrador!: PreviewBorrador;

  mode: 'create' | 'edit' = 'create';
  idVoucherEdit: number = 0;
  cambiarEstado: boolean = false;


  // gift card
  tipoTitulo: string = '(Tipo de voucher)';
  tipoDescripcion: string = '';
  montoBeneficio?: number;
  puntosRequeridos?: number;

  beneficiarioLinea1: string = '';
  beneficiarioLinea2: string = '';

  fechaAdqISO?: string; // ISO
  codigoTexto: string = '(se asigna al guardar)';

  ngOnInit(): void {
    const state = history.state ?? {};

    this.from = state?.from ?? 'dashboard';

    this.mode = (state?.mode === 'edit') ? 'edit' : 'create';
    this.idVoucherEdit = Number(state?.idVoucherEdit ?? state?.idVoucher ?? 0);

    // ✅ viene desde editar-voucher (switch) - si no viene, queda false
    this.cambiarEstado = Boolean(state?.cambiarEstado ?? false);

    // ✅ soportar ambos nombres (estadoVoucher es el real del backend)
    const estado = Number(
      state?.borrador?.estadoVoucher ?? state?.borrador?.idEstadoVoucher ?? 0
    );

    this.borrador = {
      idCliente: Number(state?.borrador?.idCliente ?? 0),
      idVoucherTipo: Number(state?.borrador?.idVoucherTipo ?? 0),
      idEstadoVoucher: estado,
      fechaAdquisicion: String(state?.borrador?.fechaAdquisicion ?? ''),
    };

    this.fechaAdqISO = this.toIso(this.borrador.fechaAdquisicion);

    // ✅ Código visible en la gift card
    if (this.mode === 'edit' && this.idVoucherEdit > 0) {
      this.codigoTexto = String(this.idVoucherEdit);
    } else {
      this.codigoTexto = '(se asigna al guardar)';
    }

    // Extras opcionales (beneficiario)
    const extras = state?.extras as
      | {
          beneficiario?: { etiqueta?: string; documento?: string };
        }
      | undefined;

    if (extras?.beneficiario) {
      const etiqueta = String(extras.beneficiario.etiqueta ?? '').trim();
      const doc = String(extras.beneficiario.documento ?? '').trim();
      this.beneficiarioLinea1 = etiqueta;
      this.beneficiarioLinea2 = doc;
    }

    // SIEMPRE cargamos el voucher-tipo por ID para asegurar:
    // titulo, descripcion, montoBeneficio, puntosRequeridos
    this.cargarTipo(this.borrador.idVoucherTipo);

    // Si no vino beneficiario por extras, lo buscamos por endpoints
    if (!this.beneficiarioLinea1) {
      this.cargarBeneficiario(this.borrador.idCliente);
    }

    Promise.resolve().then(() => this.cdr.markForCheck());
  }


  private toIso(ymd?: string | null): string | undefined {
    if (!ymd) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
      const d = new Date(`${ymd}T00:00:00`);
      return d.toISOString();
    }
    return ymd;
  }

  private cargarTipo(idTipo: number): void {
    if (!idTipo || idTipo <= 0) return;

    this.http.get<any>(`/api/voucher-tipo/${idTipo}`).subscribe({
      next: (raw: any) => {
        this.tipoTitulo = String(raw?.titulo ?? this.tipoTitulo);
        this.tipoDescripcion = String(raw?.descripcion ?? '');

        const monto = Number(raw?.montoBeneficio);
        this.montoBeneficio = Number.isFinite(monto) ? monto : undefined;

        const puntos = Number(raw?.puntosRequeridos);
        this.puntosRequeridos = Number.isFinite(puntos) ? puntos : undefined;

        this.cdr.markForCheck();
      },
      error: () => {
        // dejamos placeholders, no rompemos UI
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Regla:
   * - Si Cliente.idTipoCliente ∈ {2,3} => Razón Social + CUIT(dniCuitCuil desde /api/usuarios/:id).
   * - Si Cliente.idTipoCliente = 1 => Apellidos+Nombres + DNI(dniCuitCuil) desde /api/usuarios/:id.
   */
  private cargarBeneficiario(idCliente: number): void {
    if (!idCliente || idCliente <= 0) {
      this.beneficiarioLinea1 = 'Cliente no especificado';
      this.beneficiarioLinea2 = '';
      this.cdr.markForCheck();
      return;
    }

    this.http.get<any>(`/api/clientes/${idCliente}`).subscribe({
      next: (cli: any) => {
        const tipo = Number(cli?.idTipoCliente ?? 0);
        const idUsuario = Number(cli?.idUsuario ?? idCliente);

        if (tipo === 2 || tipo === 3) {
          const rs = (cli?.razonSocial ?? '').toString().trim();

          this.http.get<any>(`/api/usuarios/${idUsuario}`).subscribe({
            next: (u: any) => {
              const doc = (u?.dniCuitCuil ?? '').toString().trim();
              this.beneficiarioLinea1 = rs || `Cliente #${idCliente}`;
              this.beneficiarioLinea2 = doc ? `CUIT: ${doc}` : '';
              this.cdr.markForCheck();
            },
            error: () => {
              this.beneficiarioLinea1 = rs || `Cliente #${idCliente}`;
              this.beneficiarioLinea2 = '';
              this.cdr.markForCheck();
            },
          });
          return;
        }

        // Ciudadano
        this.cargarUsuarioParaCiudadano(idCliente);
      },
      error: () => {
        this.beneficiarioLinea1 = `Cliente #${idCliente}`;
        this.beneficiarioLinea2 = '';
        this.cdr.markForCheck();
      },
    });
  }

  private cargarUsuarioParaCiudadano(idUsuario: number): void {
    this.http.get<any>(`/api/usuarios/${idUsuario}`).subscribe({
      next: (u: any) => {
        const ape = (u?.apellidos ?? '').toString().trim();
        const nom = (u?.nombres ?? '').toString().trim();
        const dni = (u?.dniCuitCuil ?? '').toString().trim();

        const full = [ape, nom].filter(Boolean).join(' ').trim();
        this.beneficiarioLinea1 = full || `Cliente #${idUsuario}`;
        this.beneficiarioLinea2 = dni ? `DNI: ${dni}` : '';
        this.cdr.markForCheck();
      },
      error: () => {
        this.beneficiarioLinea1 = `Cliente #${idUsuario}`;
        this.beneficiarioLinea2 = '';
        this.cdr.markForCheck();
      },
    });
  }

  onVolver(): void {
    if (this.mode === 'edit' && this.idVoucherEdit > 0) {
      this.router.navigate(
        ['menu-principal/admin/vouchers/voucher/editar', this.idVoucherEdit],
        { state: { backTo: this.from } }
      );
      return;
    }

    this.router.navigate(
      ['menu-principal/admin/vouchers/voucher/crear'],
      { state: { borrador: this.borrador, from: this.from } }
    );
  }

  onGuardar(): void {
    
    const payload = {
      idCliente: this.borrador.idCliente,
      idVoucherTipo: this.borrador.idVoucherTipo,
      estadoVoucher: this.borrador.idEstadoVoucher, // <-- CAMBIO
      fechaAdquisicion: this.fechaAdqISO,
    };

    this.http.post('/api/vouchers', payload).subscribe({
      next: () => {
        alert('Voucher creado correctamente.');
        if (this.from === 'listar-tipo-voucher') {
          this.router.navigate(
            ['/menu-principal/admin/vouchers/voucher-tipo/listar'],
            { queryParams: { t: Date.now() } }
          );
        } else {
          this.router.navigate(
            ['/menu-principal/admin/vouchers'],
            { queryParams: { t: Date.now() } }
          );
        }
      },
      error: (err: any) => {
        console.error('Error creando voucher (preview)', err);
        alert(err?.error?.message ?? 'No se pudo crear el voucher.');
      },
    });
  }

  onActualizar(): void {
    if (!this.idVoucherEdit || this.idVoucherEdit <= 0) {
      alert('ID de voucher inválido para actualizar.');
      return;
    }

    // Update general: SOLO idCliente e idVoucherTipo
    const payloadUpdate: any = {
      idCliente: Number(this.borrador.idCliente),
      idVoucherTipo: Number(this.borrador.idVoucherTipo),
    };

    const estadoNuevo = Number(this.borrador.idEstadoVoucher);

    // Si el switch está apagado => SOLO update
    if (!this.cambiarEstado) {
      this.http.patch(`/api/vouchers/${this.idVoucherEdit}`, payloadUpdate).subscribe({
        next: () => {
          alert('Voucher actualizado correctamente.');
          this.router.navigate(['/menu-principal/admin/vouchers'], { queryParams: { t: Date.now() } });
        },
        error: (err: any) => {
          console.error('Error actualizando voucher (preview)', err);
          const msg = Array.isArray(err?.error?.message)
            ? err.error.message.join('\n')
            : (err?.error?.message ?? 'No se pudo actualizar el voucher.');
          alert(msg);
        },
      });
      return;
    }

    // Switch encendido => update + updateEstado
    this.http.patch(`/api/vouchers/${this.idVoucherEdit}`, payloadUpdate).subscribe({
      next: () => {
        // luego cambio de estado
        this.http.patch(`/api/vouchers/${this.idVoucherEdit}/estado`, { idEstadoVoucher: estadoNuevo }).subscribe({
          next: () => {
            alert('Voucher actualizado correctamente.');
            this.router.navigate(['/menu-principal/admin/vouchers'], { queryParams: { t: Date.now() } });
          },
          error: (err: any) => {
            console.error('Error cambiando estado (preview)', err);
            const msg = Array.isArray(err?.error?.message)
              ? err.error.message.join('\n')
              : (err?.error?.message ?? 'No se pudo cambiar el estado del voucher.');
            alert(msg);
          },
        });
      },
      error: (err: any) => {
        console.error('Error actualizando voucher (preview)', err);
        const msg = Array.isArray(err?.error?.message)
          ? err.error.message.join('\n')
          : (err?.error?.message ?? 'No se pudo actualizar el voucher.');
        alert(msg);
      },
    });
  }



    get estadoTexto(): string {
    switch (Number(this.borrador?.idEstadoVoucher ?? 0)) {
      case 1: return 'CREADO';
      case 2: return 'ADQUIRIDO';
      case 3: return 'UTILIZADO';
      case 4: return 'ANULADO';
      default: return 'DESCONOCIDO';
    }
  }
}
