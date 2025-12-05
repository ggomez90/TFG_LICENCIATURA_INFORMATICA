import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { EncuestaApi } from '../../../../../api/encuesta.api';

type TipoSeleccion = 'single' | 'multiple';

interface OpcionPreview {
  id: string;
  texto: string;
  detalle?: string;
}

interface EncuestaBorrador {
  titulo: string;
  descripcion: string;
  fechaPublicacion: string; // yyyy-MM-dd
  fechaCierre: string;      // yyyy-MM-dd
  activa: boolean;
  opciones: OpcionPreview[];
  tipoSeleccion: TipoSeleccion;
}

@Component({
  selector: 'app-preview-encuesta',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './preview-encuesta.component.html',
  styleUrls: ['./preview-encuesta.component.scss'],
})
export class PreviewEncuestaComponent implements OnInit {
  borrador: EncuestaBorrador | null = null;

  tituloHtml: SafeHtml | null = null;
  descripcionHtml: SafeHtml | null = null;

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly sanitizer: DomSanitizer,
    private readonly encuestaApi: EncuestaApi,
  ) {}

  ngOnInit(): void {
    const incoming = history.state?.borrador as Partial<EncuestaBorrador> | undefined;
    this.borrador = {
      titulo: incoming?.titulo ?? '',
      descripcion: incoming?.descripcion ?? '',
      fechaPublicacion: incoming?.fechaPublicacion ?? '',
      fechaCierre: incoming?.fechaCierre ?? '',
      activa: incoming?.activa ?? true,
      opciones: Array.isArray(incoming?.opciones) ? incoming!.opciones! : [],
      tipoSeleccion: (incoming?.tipoSeleccion as TipoSeleccion) ?? 'single',
    };

    this.tituloHtml = this.sanitizer.bypassSecurityTrustHtml(this.borrador.titulo || '(Sin título)');
    this.descripcionHtml = this.sanitizer.bypassSecurityTrustHtml(this.borrador.descripcion || '(Sin descripción)');
  }

  get isMultiple(): boolean {
    return this.borrador?.tipoSeleccion === 'multiple';
  }

  private toIsoDate(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr;
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toISOString();
  }

  onVolver(): void {
    if (!this.borrador) return;
    this.router.navigate(
      ['/menu-principal/admin/biblioteca/encuestas/nueva'],
      { state: { borrador: this.borrador } }
    );
  }

  onConfirmarPublicar(): void {
    if (!this.borrador) return;

    if (!this.borrador.fechaPublicacion || !this.borrador.fechaCierre) {
      alert('Las fechas de publicación y cierre son obligatorias.');
      return;
    }

    const tituloPlano = this.stripHtml(this.borrador.titulo).slice(0, 100);

    const encuestaJSON = {
      __meta: 'encuesta:v1',
      tipoSeleccion: this.borrador.tipoSeleccion, // 'single' | 'multiple'
      opciones: this.borrador.opciones.map(o => ({ id: o.id, texto: o.texto, detalle: o.detalle ?? undefined })),
    };

    const descripcionConJson =
      `${(this.borrador.descripcion || '').trim()}\n<!--ENCUESTA_JSON${JSON.stringify(encuestaJSON)}-->`;

    // usa any
    const payload: any = {
      idAdmin: 1, //id real
      titulo: tituloPlano,
      descripcion: descripcionConJson,
      fechaPublicacion: this.toIsoDate(this.borrador.fechaPublicacion),
      fechaCierre: this.toIsoDate(this.borrador.fechaCierre),
      activa: this.borrador.activa,
    };

    this.encuestaApi.create(payload).subscribe({
      next: () => {
        alert('Encuesta publicada correctamente.');
        this.router.navigate(['/menu-principal/admin/biblioteca']);
      },
      error: (err) => {
        console.error('Error creando encuesta', err);
        alert('Ocurrió un error al crear la encuesta.');
      },
    });
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').trim();
  }
}
