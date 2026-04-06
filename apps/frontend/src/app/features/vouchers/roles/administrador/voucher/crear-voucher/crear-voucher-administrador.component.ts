import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

import { VoucherApi, EstadoVoucherCode } from '../../../../../../api/voucher.api';
import { ClienteApi, ClienteDto } from '../../../../../../api/cliente.api';
import { UsuariosApi, UsuarioDto } from '../../../../../../api/usuarios.api';


type BackTo = 'dashboard' | 'listar';

interface CrearVoucherForm {
  idCliente: number | null;
  idVoucherTipo: number | null;
  idEstadoVoucher: number;     // 1=CREADO, 2=ADQUIRIDO, 3=UTILIZADO, 4=ANULADO
  fechaAdquisicion: string;    // yyyy-MM-dd
}

interface VoucherTipoOption {
  idVoucherTipo: number;
  titulo: string;
  activa: boolean;
}

type BeneficiarioView =
  | { tipo: 'ciudadano'; etiqueta: string; documento: string }     // Apellidos + Nombres, DNI
  | { tipo: 'empresa';   etiqueta: string; documento: string };    // Razón Social, CUIT

interface PreviewExtras {
  voucherTipoTitulo: string;
  beneficiario: BeneficiarioView;
}


@Component({
  standalone: true,
  selector: 'app-crear-voucher-adm',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './crear-voucher-administrador.component.html',
  styleUrls: ['./crear-voucher-administrador.component.scss'],
})
export class CrearVoucherAdministradorComponent implements OnInit {
  private router = inject(Router);
  private voucherApi = inject(VoucherApi);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

  private clienteApi = inject(ClienteApi);
  private usuariosApi = inject(UsuariosApi);

  backTo: BackTo = 'dashboard';

  // Catálogo de estados
  readonly ESTADO = {
    CREADO: 1,
    ADQUIRIDO: 2,
    UTILIZADO: 3,
    ANULADO: 4,
  } as const;

  estados = [
    { value: 1, label: 'Creado' },
    { value: 2, label: 'Adquirido' },
    { value: 3, label: 'Utilizado' },
    { value: 4, label: 'Anulado' },
  ];

  // Listado de tipos para seleccionar
  tipos: VoucherTipoOption[] = [];
  cargandoTipos = false;

  form: CrearVoucherForm = this.emptyForm();
  original: CrearVoucherForm = this.emptyForm();
  loading = false;
  errorMsg: string | null = null;

  ngOnInit(): void {
    const state = history.state ?? {};
    this.backTo = state?.backTo === 'listar' ? 'listar' : 'dashboard';

    // Si vuelven desde preview con un borrador, restaurarlo
    const borrador = state?.borrador as Partial<CrearVoucherForm> | undefined;
    if (borrador) {
      this.form = {
        idCliente: this.coerceIntOrNull(borrador.idCliente),
        idVoucherTipo: this.coerceIntOrNull(borrador.idVoucherTipo),
        idEstadoVoucher: this.coerceInt(borrador.idEstadoVoucher, this.ESTADO.ADQUIRIDO),
        fechaAdquisicion: borrador.fechaAdquisicion ?? this.todayYmd(),
      };
      this.original = { ...this.form };
    } else {
      // Setear valores por defecto
      this.form = this.emptyForm();
      this.original = { ...this.form };
    }

    // Cargar tipos para el selector
    this.cargarTipos();
  }

  // Navegación
  onVolver(): void {
    if (this.backTo === 'listar') {
      this.router.navigate(['/menu-principal/admin/vouchers/voucher-tipo/listar']);
    } else {
      this.router.navigate(['/menu-principal/admin/vouchers']);
    }
  }

  onLimpiar(): void {
    this.form = { ...this.original };
  }

  onPrevisualizar(): void {
    const err = this.validate();
    if (err) { alert(err); return; }

    const idCliente = this.coerceInt(this.form.idCliente, 0);
    const idTipo    = this.coerceInt(this.form.idVoucherTipo, 0);

    // 1) Validar Tipo de voucher: existe y está ACTIVO
    this.http.get<any>(`/api/voucher-tipo/${idTipo}`).subscribe({
      next: (tipo: any) => {
        if (!tipo) { alert('El Tipo de voucher no existe.'); return; }
        if (!Boolean(tipo.activa)) { alert('El Tipo de voucher está inactivo.'); return; }

        // 2) Validar Cliente: existe
        this.http.get<any>(`/api/clientes/${idCliente}`).subscribe({
          next: (cli: any) => {
            if (!cli) { alert('El Cliente no existe.'); return; }

            const tipoCli = Number(cli.idTipoCliente ?? 1);
            const voucherTipoTitulo = String(tipo.titulo ?? '(Sin título)');

            // 3) Resolver beneficiario con dniCuitCuil 
            if (tipoCli === 1) {
              // ciudadano: idCliente === idUsuario
              this.http.get<any>(`/api/usuarios/${idCliente}`).subscribe({
                next: (u: any) => {
                  const ap = String(u?.apellidos ?? '').trim();
                  const no = String(u?.nombres ?? '').trim();
                  const etiqueta = `${ap} ${no}`.trim() || '(Sin nombre)';
                  const doc = String(u?.dniCuitCuil ?? '').trim() || '(Sin documento)';

                  this.router.navigate(
                    ['/menu-principal', 'admin', 'vouchers', 'voucher', 'preview'],
                    {
                      state: {
                        borrador: this.form,
                        from: this.backTo, // dashboard|listar
                        extras: {
                          voucherTipoTitulo,
                          beneficiario: {
                            etiqueta,
                            documento: `DNI: ${doc}`,
                          },
                        },
                      },
                    }
                  );
                },
                error: () => alert('No se pudo obtener el Usuario asociado (ciudadano).'),
              });
            } else {
              // PYME/EMPRESA o INSTITUCIÓN
              const razon = String(cli?.razonSocial ?? '').trim() || '(Sin razón social)';
              const idUsuario = Number(cli?.idUsuario ?? idCliente);

              this.http.get<any>(`/api/usuarios/${idUsuario}`).subscribe({
                next: (u: any) => {
                  const doc = String(u?.dniCuitCuil ?? '').trim() || '(Sin CUIT)';

                  this.router.navigate(
                    ['/menu-principal', 'admin', 'vouchers', 'voucher', 'preview'],
                    {
                      state: {
                        borrador: this.form,
                        from: this.backTo,
                        extras: {
                          voucherTipoTitulo,
                          beneficiario: {
                            etiqueta: razon,
                            documento: `CUIT: ${doc}`,
                          },
                        },
                      },
                    }
                  );
                },
                error: () => {
                  // fallback: si no pudimos traer usuario avanzar con CUIT no disponible
                  this.router.navigate(
                    ['/menu-principal', 'admin', 'vouchers', 'voucher', 'preview'],
                    {
                      state: {
                        borrador: this.form,
                        from: this.backTo,
                        extras: {
                          voucherTipoTitulo,
                          beneficiario: {
                            etiqueta: razon,
                            documento: `CUIT: (no disponible)`,
                          },
                        },
                      },
                    }
                  );
                },
              });
            }
          },
          error: () => alert('El Cliente no existe.'),
        });
      },
      error: () => alert('El Tipo de voucher no existe.'),
    });
  }

  onCrear(): void {
    const err = this.validate();
    if (err) { alert(err); return; }

    const payload = {
      idCliente: this.coerceInt(this.form.idCliente, 0),
      idVoucherTipo: this.coerceInt(this.form.idVoucherTipo, 0),
      estadoVoucher: this.coerceInt(this.form.idEstadoVoucher, this.ESTADO.ADQUIRIDO) as EstadoVoucherCode,
      fechaAdquisicion: this.toIso(this.form.fechaAdquisicion),
    };

    this.loading = true; this.errorMsg = null;
    this.voucherApi.create(payload).subscribe({
      next: () => {
        alert('Voucher creado correctamente.');
        if (this.backTo === 'listar') {
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
        console.error('Error creando voucher', err);
        this.errorMsg = err?.error?.message ?? 'No se pudo crear el voucher.';
        alert(this.errorMsg);
      },
      complete: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Carga de Tipos
  private cargarTipos(): void {
    this.cargandoTipos = true;

    const params = new HttpParams()
      .set('limit', 1000)
      .set('offset', 0);

    this.http.get<any>('/api/voucher-tipo', { params }).subscribe({
      next: (resp: any) => {
        const src = Array.isArray(resp?.items) ? resp.items
          : (Array.isArray(resp) ? resp : []);
        this.tipos = src.map((r: any) => ({
          idVoucherTipo: Number(r.idVoucherTipo),
          titulo: (r.titulo ?? '(Sin título)').toString(),
          activa: Boolean(r.activa),
        }));
      },
      error: (err: any) => {
        console.error('Error cargando tipos de voucher', err);
        this.tipos = [];
      },
      complete: () => {
        this.cargandoTipos = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Helpers
  private emptyForm(): CrearVoucherForm {
    return {
      idCliente: null,
      idVoucherTipo: null,
      idEstadoVoucher: this.ESTADO.ADQUIRIDO,
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

  private toIso(dateYMD: string): string {
    const d = new Date(`${dateYMD}T00:00:00`);
    return d.toISOString();
  }

  private validate(): string | null {
    const f = this.form;

    if (!Number.isInteger(f.idCliente) || (f.idCliente ?? 0) <= 0) {
      return 'Debés indicar un ID de cliente válido (entero > 0).';
    }
    if (!Number.isInteger(f.idVoucherTipo) || (f.idVoucherTipo ?? 0) <= 0) {
      return 'Debés indicar un Tipo de voucher válido (entero > 0).';
    }
    if (![1, 2, 3, 4].includes(Number(f.idEstadoVoucher))) {
      return 'Estado inválido.';
    }
    if (!f.fechaAdquisicion) {
      return 'La fecha de adquisición es obligatoria.';
    }

    return null;
  }
}
