import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { ContenidoApi } from '../../../../../api/contenido.api';

interface CrearContenidoForm {
  titulo: string;
  descripcion: string;
  urlRecurso: string;
  fechaPublicacion: string;
  fechaBaja: string | null;
  visible: boolean;
}

@Component({
  selector: 'app-preview-contenido-educativo',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './preview-contenido-educativo.component.html',
  styleUrls: ['./preview-contenido-educativo.component.scss'],
})
export class PreviewContenidoEducativoComponent implements OnInit {
  borrador: CrearContenidoForm | null = null;

  tituloHtml: SafeHtml | null = null;
  descripcionHtml: SafeHtml | null = null;
  videoEmbedUrl: SafeResourceUrl | null = null;

  modo: 'nuevo' | 'editar' = 'nuevo';
  idContenido: number | null = null;

  constructor(
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly contenidoApi: ContenidoApi,
  ) {
    const nav = this.router.getCurrentNavigation();
    const state = (nav?.extras?.state as any) ?? {};
    this.borrador = state['borrador'] ?? null;
    this.modo = state['modo'] === 'editar' ? 'editar' : 'nuevo';
    this.idContenido = state['idContenido'] ? Number(state['idContenido']) : null;
  }

  ngOnInit(): void {
    if (!this.borrador) {
      if (this.modo === 'editar' && this.idContenido) {
        this.router.navigate([
          '/menu-principal', 'admin', 'biblioteca', 'contenidos', 'editar', this.idContenido,
        ]);
      } else {
        this.router.navigate([
          '/menu-principal', 'admin', 'biblioteca', 'contenidos', 'nuevo',
        ]);
      }
      return;
    }

    const titulo = this.borrador.titulo || '(Sin título)';
    const descripcion = this.borrador.descripcion || '(Sin descripción)';

    this.tituloHtml = this.sanitizer.bypassSecurityTrustHtml(titulo);
    this.descripcionHtml = this.sanitizer.bypassSecurityTrustHtml(descripcion);
    this.videoEmbedUrl = this.getVideoEmbedUrl(this.borrador.urlRecurso);
  }

  private getVideoEmbedUrl(url: string | undefined | null): SafeResourceUrl | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (!trimmed) return null;

    const youtubeMatch = trimmed.match(/[?&]v=([^&]+)/);
    const shortMatch = trimmed.match(/youtu\.be\/([^?]+)/);

    let videoId: string | null = null;
    if (youtubeMatch && youtubeMatch[1]) videoId = youtubeMatch[1];
    else if (shortMatch && shortMatch[1]) videoId = shortMatch[1];

    if (!videoId) return null;

    const embed = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }

  onVolverAEditar(): void {
    if (!this.borrador) {
      if (this.modo === 'editar' && this.idContenido) {
        this.router.navigate([
          '/menu-principal', 'admin', 'biblioteca', 'contenidos', 'editar', this.idContenido,
        ]);
      } else {
        this.router.navigate([
          '/menu-principal', 'admin', 'biblioteca', 'contenidos', 'nuevo',
        ]);
      }
      return;
    }

    if (this.modo === 'editar' && this.idContenido) {
      this.router.navigate(
        ['/menu-principal', 'admin', 'biblioteca', 'contenidos', 'editar', this.idContenido],
        {
          state: {
            borrador: this.borrador,
            modo: 'editar',
            idContenido: this.idContenido,
          },
        },
      );
      return;
    }

    this.router.navigate(
      ['/menu-principal', 'admin', 'biblioteca', 'contenidos', 'nuevo'],
      {
        state: {
          borrador: this.borrador,
          modo: 'nuevo',
        },
      },
    );
  }

  // Convierte 'YYYY-MM-DD' en ISO válido para IsDateString()
  private toIsoDate(dateStr: string | null): string | null {
    if (!dateStr) return null;
    if (dateStr.includes('T')) return dateStr;
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toISOString();
  }

  onConfirmarPublicar(): void {
    if (!this.borrador) return;

    if (!this.borrador.fechaPublicacion) {
      alert('La fecha de publicación es obligatoria para publicar.');
      return;
    }

    const payload: any = {
      idAdmin: 1,
      fechaPublicacion: this.toIsoDate(this.borrador.fechaPublicacion) as string,
      visible: this.borrador.visible,
    };

    if (this.borrador.titulo?.trim()) payload.titulo = this.borrador.titulo.trim();
    if (this.borrador.descripcion?.trim()) payload.descripcion = this.borrador.descripcion.trim();
    if (this.borrador.urlRecurso?.trim()) payload.urlRecurso = this.borrador.urlRecurso.trim();
    if (this.borrador.fechaBaja) payload.fechaBaja = this.toIsoDate(this.borrador.fechaBaja) as string;

    const request$ =
      this.modo === 'editar' && this.idContenido
        ? this.contenidoApi.update(this.idContenido, payload)
        : this.contenidoApi.create(payload);

    request$.subscribe({
      next: () => {
        alert(
          this.modo === 'editar'
            ? 'Contenido actualizado correctamente.'
            : 'Contenido publicado correctamente.'
        );
        this.router.navigate(['/menu-principal', 'admin', 'biblioteca']);
      },
      error: (err) => {
        console.error(
          'Error guardando contenido desde preview',
          'status =',
          err?.status,
          'body =',
          err?.error
        );
        alert(
          this.modo === 'editar'
            ? 'Ocurrió un error al actualizar el contenido desde la previsualización.'
            : 'Ocurrió un error al publicar el contenido desde la previsualización.'
        );
      },
    });
  }
}
