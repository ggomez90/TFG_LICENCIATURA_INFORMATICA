import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { VoucherApi, VoucherListItem, EstadoVoucherCode } from '../../../../../api/voucher.api';
import { VoucherTipoApi } from '../../../../../api/voucher-tipo.api';

//import { jsPDFAPI } from 'jspdf';
import html2canvas from 'html2canvas';
import {jsPDF } from 'jspdf';

@Component({
  standalone: true,
  selector: 'app-ver-voucher-cliente',
  imports: [CommonModule, RouterModule],
  templateUrl: './ver-voucher-cliente.component.html',
  styleUrls: ['./ver-voucher-cliente.component.scss'],
})
export class VerVoucherClienteComponent implements OnInit {
  @ViewChild('voucherPdf', { static: false })
  voucherPdf?: ElementRef<HTMLElement>;

  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private voucherTipoApi = inject(VoucherTipoApi);
  private voucherApi = inject(VoucherApi);
  private cdr = inject(ChangeDetectorRef);
  private http = inject(HttpClient);

  loading = true;
  error: string | null = null;

  voucherId = 0;
  voucher: VoucherListItem | null = null;

  tipoTitulo = '(Tipo de voucher)';
  tipoDescripcion = '';
  montoBeneficio?: number;
  puntosRequeridos?: number;

  beneficiarioLinea1 = '';
  beneficiarioLinea2 = '';

  fechaAdqISO?: string;
  fechaUsoISO?: string | null;
  codigoTexto = '-';

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

        this.cargarTipo(idTipo);
        this.cargarBeneficiario();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('[VerVoucherCliente] Error cargando voucher', err);
        this.loading = false;
        this.error = err?.error?.message ?? 'No se pudo cargar el voucher.';
        this.cdr.detectChanges();
      },
    });
  }

  private cargarTipo(idTipo: number): void {
    if (!idTipo || idTipo <= 0) return;

    this.voucherTipoApi.getDisponibleClienteById(idTipo).subscribe({
      next: (raw: any) => {
        this.tipoTitulo = String(raw?.titulo ?? this.tipoTitulo);
        this.tipoDescripcion = String(raw?.descripcion ?? '');

        const monto = Number(raw?.montoBeneficio);
        this.montoBeneficio = Number.isFinite(monto) ? monto : undefined;

        const puntos = Number(raw?.puntosRequeridos);
        this.puntosRequeridos = Number.isFinite(puntos) ? puntos : undefined;

        this.cdr.detectChanges();
      },
      error: () => {
        this.cdr.detectChanges();
      },
    });
  }

  private cargarBeneficiario(): void {
    this.http.get<any>('/api/clientes/me').subscribe({
      next: (cli: any) => {
        const tipo = Number(cli?.idTipoCliente ?? 0);

        this.http.get<any>('/api/usuarios/me').subscribe({
          next: (u: any) => {
            const doc = (u?.dniCuitCuil ?? '').toString().trim();

            if (tipo === 2 || tipo === 3) {
              const rs = (cli?.razonSocial ?? '').toString().trim();
              this.beneficiarioLinea1 = rs || 'Cliente';
              this.beneficiarioLinea2 = doc ? `CUIT: ${doc}` : '';
            } else {
              const ape = (u?.apellidos ?? '').toString().trim();
              const nom = (u?.nombres ?? '').toString().trim();
              const full = [ape, nom].filter(Boolean).join(' ').trim();

              this.beneficiarioLinea1 = full || 'Cliente';
              this.beneficiarioLinea2 = doc ? `DNI: ${doc}` : '';
            }

            this.cdr.detectChanges();
          },
          error: () => {
            if (tipo === 2 || tipo === 3) {
              const rs = (cli?.razonSocial ?? '').toString().trim();
              this.beneficiarioLinea1 = rs || 'Cliente';
              this.beneficiarioLinea2 = '';
            } else {
              this.beneficiarioLinea1 = 'Cliente';
              this.beneficiarioLinea2 = '';
            }

            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        this.beneficiarioLinea1 = 'Cliente';
        this.beneficiarioLinea2 = '';
        this.cdr.detectChanges();
      },
    });
  }

  async descargarPdf(): Promise<void> {
    if (!this.voucherPdf?.nativeElement) return;

    const element = this.voucherPdf.nativeElement;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10;
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      const codigo = this.codigoTexto || this.voucherId || 'voucher';
      pdf.save(`voucher-${codigo}.pdf`);
    } catch (err) {
      console.error('[VerVoucherCliente] Error generando PDF', err);
      this.error = 'No se pudo generar el PDF del voucher.';
      this.cdr.detectChanges();
    }
  }

  onVolver(): void {
    this.router.navigate(['/menu-principal/cliente/vouchers/mis-vouchers'], {
      queryParams: { t: Date.now() },
    });
  }

  anularVoucher(idVoucher: number): void {
    this.voucherApi.anularCliente(idVoucher).subscribe({
      next: () => {
        this.router.navigate(['/menu-principal/cliente/vouchers/mis-vouchers'], {
          queryParams: { t: Date.now() },
        });
      },
      error: (err) => {
        console.error('[VerVoucherCliente] Error anulando voucher', err);
        this.error = err?.error?.message ?? 'No se pudo anular el voucher.';
        this.cdr.detectChanges();
      },
    });
  }

  onAnular(): void {
    if (!this.voucher) return;
    this.anularVoucher(this.voucher.idVoucher);
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

    if (e === 3) return 'state-badge--ok';
    if (e === 4) return 'state-badge--muted';

    return 'state-badge--muted2';
  }

  get puedeAnular(): boolean {
    return Number(this.voucher?.estadoVoucher ?? 0) === 2;
  }
}