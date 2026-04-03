import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { RolesService } from '../../../auth/roles.service';
import { DesafioApi } from '../../../api/desafio.api';
import { InscripcionApi, InscripcionDesafioItem } from '../../../api/inscripcion.api';

interface DesafioView {
  idDesafio: number;
  titulo: string;
  descripcion: string;
  tipoResiduo: string;
  requiereInscripcion: boolean;
  unidadMedida: string;
  meta: number;
  puntosTotales: number;
  puntosPorUnidad?: number | null;
  bonificacionDesafioCompleto?: number | null;
  otorgaPuntosParcial: boolean;
  fechaInicio: string;
  fechaFin?: string | null;
  estado: 1 | 2 | 3;
  idRecursoEducativo?: number | null;
}

@Component({
  selector: 'app-ver-desafio',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ver-desafio.component.html',
  styleUrls: ['./ver-desafio.component.scss'],
})
export class VerDesafioComponent implements OnInit {
  id!: number;

  data: DesafioView | null = null;

  tituloHtml: SafeHtml | null = null;
  descripcionHtml: SafeHtml | null = null;

  loading = false;
  errorMsg: string | null = null;

  from: 'dashboard' | 'listado' | 'mis-desafios' = (history.state?.from as any) ?? 'dashboard';

  // cliente
  isAdmin = false;
  isCliente = false;

  yaInscripto = false;
  inscripcionActual: InscripcionDesafioItem | null = null;
  creandoInscripcion = false;

  // modal/alert
  showSuccessModal = false;
  successMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly roles: RolesService,
    private readonly desafioApi: DesafioApi,
    private readonly inscripcionApi: InscripcionApi,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('idDesafio');
    this.id = Number(param);

    this.isAdmin = this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']);
    this.isCliente = this.roles.hasAnyRole(['CLIENTE']);

    if (!this.id || Number.isNaN(this.id)) {
      this.errorMsg = 'Identificador de desafío inválido.';
      return;
    }

    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.desafioApi.getById(this.id).subscribe({
      next: (item) => {
        this.data = {
          idDesafio: item.idDesafio,
          titulo: item.titulo ?? '',
          descripcion: item.descripcion ?? '',
          tipoResiduo: item.tipoResiduo ?? '-',
          requiereInscripcion: !!item.requiereInscripcion,
          unidadMedida: item.unidadMedida ?? '-',
          meta: Number(item.meta ?? 0),
          puntosTotales: Number(item.puntosTotales ?? 0),
          puntosPorUnidad: item.puntosPorUnidad ?? null,
          bonificacionDesafioCompleto: item.bonificacionDesafioCompleto ?? null,
          otorgaPuntosParcial: !!item.otorgaPuntosParcial,
          fechaInicio: item.fechaInicio ?? '',
          fechaFin: item.fechaFin ?? null,
          estado: (item.estado as 1 | 2 | 3) ?? 1,
          idRecursoEducativo: item.idRecursoEducativo ?? null,
        };

        this.bindRich();

        if (this.isCliente) {
          this.cargarInscripcionActual();
        } else {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error cargando desafío por id', err);
        this.errorMsg = 'No fue posible cargar el detalle del desafío.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private cargarInscripcionActual(): void {
    this.inscripcionApi.list({ limit: 100 }).subscribe({
      next: (resp) => {
        const ins = (resp.items ?? []).find((x) => Number(x.idDesafio) === this.id) ?? null;
        this.inscripcionActual = ins;
        this.yaInscripto = !!ins;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error consultando inscripción actual', err);
        this.inscripcionActual = null;
        this.yaInscripto = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  private bindRich(): void {
    const t = this.data?.titulo || '(Sin título)';
    const d = this.data?.descripcion || '(Sin descripción)';
    this.tituloHtml = this.sanitizer.bypassSecurityTrustHtml(t);
    this.descripcionHtml = this.sanitizer.bypassSecurityTrustHtml(d);
  }

  get recursoUrl(): string | null {
    const id = this.data?.idRecursoEducativo;
    if (id == null) return null;
    const base = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
    return `${base}/public/recursos/${id}`;
  }

  estadoText(): string {
    switch (this.data?.estado) {
      case 1: return 'ACTIVO';
      case 2: return 'PAUSADO';
      case 3: return 'FINALIZADO';
      default: return '-';
    }
  }

  isActivo(): boolean {
    return this.data?.estado === 1;
  }

  isPausado(): boolean {
    return this.data?.estado === 2;
  }

  isFinalizado(): boolean {
    return this.data?.estado === 3;
  }

  get estaVencido(): boolean {
    if (!this.data?.fechaFin) return false;
    const fin = new Date(this.data.fechaFin);
    if (Number.isNaN(fin.getTime())) return false;

    const hoy = new Date();
    return fin.getTime() < hoy.getTime();
  }

  get puedeIniciarDesafio(): boolean {
    if (!this.isCliente) return false;
    if (!this.data) return false;
    if (this.yaInscripto) return false;
    if (this.data.estado !== 1) return false;
    if (this.estaVencido) return false;
    return true;
  }

  get estadoClienteTexto(): string {
    if (this.yaInscripto) return 'Ya te encontrás inscripto en este desafío.';
    if (this.isFinalizado()) return 'Este desafío se encuentra finalizado.';
    if (this.isPausado()) return 'Este desafío se encuentra pausado.';
    if (this.estaVencido) return 'La fecha de finalización del desafío ya venció.';
    if (this.isActivo()) return 'Este desafío está disponible para iniciar.';
    return '';
  }

  onIniciarDesafio(): void {
    if (!this.data || !this.puedeIniciarDesafio || this.creandoInscripcion) return;

    this.creandoInscripcion = true;
    this.cdr.markForCheck();

    this.inscripcionApi.create({
      idDesafio: this.data.idDesafio,
      fechaAdhesion: new Date().toISOString(),
      progreso: '0',
      puntosAcumulados: 0,
      estado: 1,
    }).subscribe({
      next: () => {
        this.creandoInscripcion = false;
        this.yaInscripto = true;
        this.successMessage = 'Tu inscripción al desafío se realizó correctamente.';
        this.showSuccessModal = true;
        this.cargarInscripcionActual();
      },
      error: (err) => {
        console.error('Error creando inscripción', err);
        this.creandoInscripcion = false;
        this.errorMsg =
          err?.error?.message ||
          'No fue posible iniciar el desafío en este momento.';
        this.cdr.detectChanges();
      },
    });
  }

  cerrarSuccessModal(): void {
    this.showSuccessModal = false;
  }

  onVolver(): void {
    const target =
      this.from === 'listado'
        ? this.isAdmin
          ? ['/menu-principal', 'admin', 'desafios', 'listado']
          : ['/menu-principal', 'cliente', 'desafios', 'listado']
        : this.from === 'mis-desafios'
          ? ['/menu-principal', 'cliente', 'desafios', 'mis-desafios']
          : this.isAdmin
            ? ['/menu-principal', 'admin', 'desafios']
            : ['/menu-principal', 'cliente', 'desafios'];

    this.router.navigate(target);
  }
}