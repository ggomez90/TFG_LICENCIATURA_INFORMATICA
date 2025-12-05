import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml, SafeResourceUrl } from '@angular/platform-browser';
import { ContenidoApi, ContenidoItem } from '../../../api/contenido.api';

@Component({
  selector: 'app-ver-contenido',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ver-contenido.component.html',
  styleUrls: ['./ver-contenido.component.scss'],
})
export class VerContenidoComponent implements OnInit {
  contenido: ContenidoItem | null = null;

  loading = false;
  errorMsg = '';
  esAdminView = false;
  publicMode = false; //modo publico arranca en falso

  tituloHtml: SafeHtml | null = null;
  descripcionHtml: SafeHtml | null = null;
  videoEmbedUrl: SafeResourceUrl | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef,
    private readonly contenidoApi: ContenidoApi,
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('idContenido');
    const id = idParam ? Number(idParam) : null;

    //detectar modo público desde la ruta
    this.publicMode = !!this.route.snapshot.data?.['public'];

    // Si es público, forzamos no-admin
    this.esAdminView = !this.publicMode && this.router.url.includes('/admin/biblioteca');

    if (!id) {
      this.errorMsg = 'Contenido no encontrado.';
      this.cdr.markForCheck();
      return;
    }

    this.cargarContenido(id);
  }

  private cargarContenido(idContenido: number): void {
    this.loading = true;
    this.errorMsg = '';
    this.cdr.markForCheck();

    // Si es admin usa endpoint admin; si es cliente o público va endpoint público
    const obs = this.esAdminView
      ? this.contenidoApi.getAdminById(idContenido)
      : this.contenidoApi.getPublicById(idContenido);

    obs.subscribe({
      next: (resp) => {
        this.contenido = resp;

        const titulo = resp.titulo ?? '(Sin título)';
        const descripcion = resp.descripcion ?? '(Sin descripción)';

        this.tituloHtml = this.sanitizer.bypassSecurityTrustHtml(titulo);
        this.descripcionHtml = this.sanitizer.bypassSecurityTrustHtml(descripcion);

        this.videoEmbedUrl = this.getVideoEmbedUrl(resp.urlRecurso ?? null);

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando contenido educativo', err);
        this.errorMsg = 'No se pudo cargar el contenido educativo.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private getVideoEmbedUrl(url: string | undefined | null): SafeResourceUrl | null {
    if (!url) return null;

    const trimmed = url.trim();
    if (!trimmed) return null;

    const youtubeMatch = trimmed.match(/[?&]v=([^&]+)/);
    const shortMatch = trimmed.match(/youtu\.be\/([^?]+)/);

    let videoId: string | null = null;

    if (youtubeMatch && youtubeMatch[1]) {
      videoId = youtubeMatch[1];
    } else if (shortMatch && shortMatch[1]) {
      videoId = shortMatch[1];
    }

    if (!videoId) {
      return null;
    }

    const embed = `https://www.youtube.com/embed/${videoId}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
  }

  onVolver(): void {
    //si se abrió en modo público, volvemos atrás o a la raíz
    if (this.publicMode) {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        this.router.navigate(['/']);
      }
      return;
    }

    // volver para admin o cliente
    if (this.esAdminView) {
      this.router.navigate(['/menu-principal/admin/biblioteca']);
    } else {
      this.router.navigate(['/menu-principal/cliente/biblioteca']);
    }
  }
}
