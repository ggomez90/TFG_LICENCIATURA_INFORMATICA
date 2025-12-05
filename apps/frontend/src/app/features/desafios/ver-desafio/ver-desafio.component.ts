import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

interface DesafioView {
  idDesafio: number;
  titulo: string;                 // HTML
  descripcion: string;            // HTML
  tipoResiduo: string;
  requiereInscripcion: boolean;
  unidadMedida: string;
  meta: number;
  puntosTotales: number;
  puntosPorUnidad?: number | null;
  bonificacionDesafioCompleto?: number | null;
  otorgaPuntosParcial: boolean;
  fechaInicio: string;            // ISO
  fechaFin?: string | null;       // ISO | null
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

  // marcar de donde llega al ver (dashboard o listado)
  from: 'dashboard' | 'listado' = (history.state?.from as any) ?? 'dashboard';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('idDesafio');
    this.id = Number(param);

    // Tomamos el item que mandamos por state desde el dashboard/listado
    const st = history.state?.item as Partial<DesafioView> | undefined;

    if (!this.id || Number.isNaN(this.id)) {
      this.errorMsg = 'Identificador de desafío inválido.';
      return;
    }

    // Si vino por state lo mostramos
    if (st && typeof st === 'object') {
      this.data = {
        idDesafio: this.id,
        titulo: st.titulo ?? '',
        descripcion: st.descripcion ?? '',
        tipoResiduo: st.tipoResiduo ?? '-',
        requiereInscripcion: !!st.requiereInscripcion,
        unidadMedida: st.unidadMedida ?? '-',
        meta: Number(st.meta ?? 0),
        puntosTotales: Number(st.puntosTotales ?? 0),
        puntosPorUnidad: st.puntosPorUnidad ?? null,
        bonificacionDesafioCompleto: st.bonificacionDesafioCompleto ?? null,
        otorgaPuntosParcial: !!st.otorgaPuntosParcial,
        fechaInicio: st.fechaInicio ?? '',
        fechaFin: st.fechaFin ?? null,
        estado: (st.estado as 1 | 2 | 3) ?? 1,
        idRecursoEducativo: st.idRecursoEducativo ?? null,
      };

      this.bindRich();
      return;
    }

    // Si no vino state, avisamos y volvemos
    this.errorMsg = 'No se encontraron datos del desafío para visualizar.';
    setTimeout(() => this.onVolver(), 0);
  }

  private bindRich(): void {
    const t = this.data?.titulo || '(Sin título)';
    const d = this.data?.descripcion || '(Sin descripción)';
    this.tituloHtml = this.sanitizer.bypassSecurityTrustHtml(t);
    this.descripcionHtml = this.sanitizer.bypassSecurityTrustHtml(d);
  }

  // URL pública al recurso educativo o null si no hay
  get recursoUrl(): string | null {
    const id = this.data?.idRecursoEducativo;
    if (id == null) return null;
    const base = (typeof window !== 'undefined' && window.location?.origin) ? window.location.origin : '';
    return `${base}/public/recursos/${id}`;
  }

  // UI helpers
  estadoText(): string {
    switch (this.data?.estado) {
      case 1: return 'ACTIVO';
      case 2: return 'PAUSADO';
      case 3: return 'FINALIZADO';
      default: return '-';
    }
  }

  isActivo()     { return this.data?.estado === 1; }
  isPausado()    { return this.data?.estado === 2; }
  isFinalizado() { return this.data?.estado === 3; }

  onVolver(): void {
    const target =
      this.from === 'listado'
        ? ['/menu-principal','admin','desafios','listado']
        : ['/menu-principal','admin','desafios'];

    this.router.navigate(target);
  }
}
