import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DesafioApi, DesafioCreateDto } from '../../../../../api/desafio.api';

type EstadoDesafio = 1 | 2 | 3;

interface DesafioForm {
  titulo: string;
  descripcion: string;
  tipoResiduo: string;
  requiereInscripcion: boolean;
  unidadMedida: string;
  meta: string;                 // texto decimal
  puntosTotales: number;        // entero
  puntosPorUnidad: string;      // texto decimal
  bonificacionDesafioCompleto: string; // texto entero
  otorgaPuntosParcial: boolean;
  fechaInicio: string;          // YYYY-MM-DD
  fechaFin: string | null;      // YYYY-MM-DD | null
  estado: EstadoDesafio;
  idRecursoEducativo: string;   // texto entero
}

@Component({
  selector: 'app-preview-desafio-administrador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './preview-desafio-administrador.component.html',
  styleUrls: ['./preview-desafio-administrador.component.scss'],
})
export class PreviewDesafioAdministradorComponent implements OnInit {
  borrador: DesafioForm | null = null;

  tituloHtml: SafeHtml | null = null;
  descripcionHtml: SafeHtml | null = null;

  saving = false;

  constructor(
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly api: DesafioApi,
  ) {
    const nav = this.router.getCurrentNavigation();
    this.borrador = (nav?.extras?.state as any)?.['borrador'] ?? null;
  }

  ngOnInit(): void {
    if (!this.borrador) {
      this.router.navigate(['/menu-principal','admin','desafios','nuevo']);
      return;
    }
    const t = this.borrador.titulo || '(Sin título)';
    const d = this.borrador.descripcion || '(Sin descripción)';
    this.tituloHtml = this.sanitizer.bypassSecurityTrustHtml(t);
    this.descripcionHtml = this.sanitizer.bypassSecurityTrustHtml(d);
  }

  onVolverAEditar(): void {
    if (!this.borrador) {
      this.router.navigate(['/menu-principal','admin','desafios','nuevo']);
      return;
    }
    this.router.navigate(
      ['/menu-principal','admin','desafios','nuevo'],
      { state: { borrador: this.borrador } }
    );
  }

  // Guardar (igualado a onCrear del componente crear-desafio)
  onGuardar(): void {
    if (!this.borrador) return;

    if (!this.borrador.fechaInicio) {
      alert('La fecha de inicio es obligatoria.');
      return;
    }
    if (this.borrador.fechaFin && this.borrador.fechaFin < this.borrador.fechaInicio) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }
    if (this.borrador.otorgaPuntosParcial && !this.borrador.puntosPorUnidad.trim()) {
      alert('Para otorgar puntos parciales, ingresá "Puntos por unidad".');
      return;
    }

    const dto = this.toCreateDto(this.borrador);
    this.saving = true;
    this.api.create(dto).subscribe({
      next: () => {
        this.saving = false;
        alert('Desafío creado correctamente.');
        this.router.navigate(['/menu-principal','admin','desafios']);
      },
      error: (err) => {
        this.saving = false;
        console.error('Error creando desafío desde la previsualización', err);
        alert('Ocurrió un error al crear el desafío desde la previsualización.');
      },
    });
  }

  // Helpers (idénticos a crear-desafio)
  private toCreateDto(f: DesafioForm): DesafioCreateDto {
    const idAdmin = 1;

    const parseDecimal = (v: string): number | null => {
      const t = (v ?? '').trim();
      if (!t) return null;
      const normalized = t.replace(',', '.');
      const n = Number(normalized);
      return Number.isFinite(n) ? n : null;
    };

    const parseIntStr = (v: string): number | null => {
      const t = (v ?? '').trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isInteger(n) ? n : null;
    };

    return {
      idAdmin,
      titulo: f.titulo?.trim() || undefined,
      descripcion: f.descripcion?.trim() || undefined,
      tipoResiduo: f.tipoResiduo?.trim() || '',
      requiereInscripcion: !!f.requiereInscripcion,
      unidadMedida: f.unidadMedida?.trim() || '',
      meta: parseDecimal(f.meta) ?? 0,
      puntosTotales: Number.isInteger(f.puntosTotales) ? f.puntosTotales : 0,
      puntosPorUnidad: parseDecimal(f.puntosPorUnidad) ?? null,
      bonificacionDesafioCompleto: parseIntStr(f.bonificacionDesafioCompleto) ?? null,
      otorgaPuntosParcial: !!f.otorgaPuntosParcial,
      // Fechas ya vienen en 'YYYY-MM-DD' desde crear; el backend las convierte a Date
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin ?? undefined,
      estado: f.estado,
      idRecursoEducativo: (() => {
        const n = parseIntStr(f.idRecursoEducativo);
        return n == null ? undefined : n;
      })(),
    };
  }
}
