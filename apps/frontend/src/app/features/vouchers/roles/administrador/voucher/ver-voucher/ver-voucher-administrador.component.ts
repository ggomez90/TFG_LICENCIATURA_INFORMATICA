import { Component, OnInit, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { VoucherApi, VoucherListItem, EstadoVoucherCode } from '../../../../../../api/voucher.api';

@Component({
  standalone: true,
  selector: 'app-ver-voucher-adm',
  imports: [CommonModule, RouterModule],
  templateUrl: './ver-voucher-administrador.component.html',
  styleUrls: ['./ver-voucher-administrador.component.scss'],
})
export class VerVoucherAdministradorComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private voucherApi = inject(VoucherApi);
  private cdr = inject(ChangeDetectorRef);

  // estado de pantalla
  loading = true;
  error: string | null = null;

  // voucher real
  voucherId = 0;
  voucher: VoucherListItem | null = null;

  // gift card (igual que preview)
  tipoTitulo: string = '(Tipo de voucher)';
  tipoDescripcion: string = '';
  montoBeneficio?: number;
  puntosRequeridos?: number;

  beneficiarioLinea1: string = '';
  beneficiarioLinea2: string = '';

  fechaAdqISO?: string; // ISO
  fechaUsoISO?: string | null;

  // en preview esto era "(se asigna al guardar)"
  codigoTexto: string = '-';

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id') ?? 0);
    this.voucherId = Number.isFinite(id) ? id : 0;

    if (!this.voucherId || this.voucherId <= 0) {
      this.loading = false;
      this.error = 'Voucher inválido.';
      this.cdr.markForCheck();
      return;
    }

    this.cargarVoucher(this.voucherId);
  }

  private cargarVoucher(idVoucher: number): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();

    this.voucherApi.getById(idVoucher).subscribe({
      next: (v: VoucherListItem) => {
        this.voucher = v;

        this.codigoTexto = String(v?.idVoucher ?? idVoucher);

        this.fechaAdqISO = v?.fechaAdquisicion ?? undefined;
        this.fechaUsoISO = v?.fechaUso ?? null;

        const idTipo = Number(v?.idVoucherTipo ?? 0);
        const idCliente = Number(v?.idCliente ?? 0);

        // cargar tipo para mostrar titulo/desc/beneficio/puntos
        this.cargarTipo(idTipo);

        // beneficiario
        this.cargarBeneficiario(idCliente);

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        console.error('[VerVoucher] Error cargando voucher', err);
        this.loading = false;
        this.error = err?.error?.message ?? 'No se pudo cargar el voucher.';
        this.cdr.markForCheck();
      },
    });
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
        // dejamos placeholders
        this.cdr.markForCheck();
      },
    });
  }

  /**
   * Regla (igual preview):
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
    // vuelve al listado/dashboard (ajustá a tu navegación real)
    this.router.navigate(['/menu-principal/admin/vouchers'], { queryParams: { t: Date.now() } });
  }

  get estadoTexto(): string {
    const e = Number(this.voucher?.estadoVoucher ?? 0) as EstadoVoucherCode | 0;
    switch (e) {
      case 1: return 'CREADO';
      case 2: return 'ADQUIRIDO';
      case 3: return 'UTILIZADO';
      case 4: return 'ANULADO';
      default: return 'DESCONOCIDO';
    }
  }

  get estadoClase(): 'state-badge--ok' | 'state-badge--muted' | 'state-badge--muted2' {
    const e = Number(this.voucher?.estadoVoucher ?? 0);
    if (e === 3) return 'state-badge--ok';       // utilizado
    if (e === 4) return 'state-badge--muted';    // anulado
    return 'state-badge--muted2';                // creado/adquirido (neutro)
  }
}
