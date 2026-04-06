import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpParams } from '@angular/common/http';

import { ContenidoApi, ContenidoItem } from '../../../../api/contenido.api';
import { EncuestaApi, EncuestaItem } from '../../../../api/encuesta.api';

interface ClienteContenidoCard {
  idContenido: number;
  titulo: string;
  fechaPublicacion: string;
  descripcionCorta?: string;
  etiqueta?: string;
}

interface ClienteEncuestaCard {
  idEncuesta: number;
  titulo: string;
  fechaPublicacion: string; // ISO
  fechaCierre?: string | null;
  activa: boolean;
}

@Component({
  selector: 'app-biblioteca-cliente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './biblioteca-cliente.component.html',
  styleUrls: ['./biblioteca-cliente.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BibliotecaClienteComponent implements OnInit {
  loadingContenidos = false;
  loadingEncuestas = false;

  errorContenidos: string | null = null;
  errorEncuestas: string | null = null;

  contenidos: ClienteContenidoCard[] = [];
  encuestas: ClienteEncuestaCard[] = [];

  contenidoRecomendado: ClienteContenidoCard | null = null;

  isGuest = false;

  constructor(
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
    private readonly contenidoApi: ContenidoApi,
    private readonly encuestaApi: EncuestaApi,
  ) {}

  ngOnInit(): void {
    this.cargarContenidos();
    this.cargarEncuestas();
  }

  // Helpers
  private getContenidoId(raw: any): number {
    const v =
      raw?.idContenidoEducativo ??
      raw?.idContenido ??
      raw?.id ??
      null;

    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  private stripHtml(input: string | null | undefined, fallback = 'Sin título'): string {
    if (!input) return fallback;
    const plain = input.replace(/<[^>]+>/g, '').trim();
    return plain || fallback;
  }

  private truncateText(input: string | null | undefined, max = 110): string {
    const t = this.stripHtml(input ?? '', '').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    if (t.length <= max) return t;
    return t.slice(0, max - 1).trimEnd() + '…';
  }

  fmtFecha(iso?: string | null): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // Navegación
  onVerTodosContenidos(): void {
    this.router.navigate(['/menu-principal/cliente/biblioteca/contenidos/lista']);
  }

  onVerTodasEncuestas(): void {
    this.router.navigate(['/menu-principal/cliente/biblioteca/encuestas/lista']);
  }

  onVerContenido(idContenido: number): void {
    this.router.navigate(['/menu-principal/cliente/biblioteca/contenidos/ver', idContenido]);
  }

  onVerEncuesta(idEncuesta: number): void {
    this.router.navigate(['/menu-principal/cliente/biblioteca/encuestas/ver', idEncuesta]);
  }

  onCallToAction(): void {
    this.onVerTodosContenidos();
  }

  // Data
  private cargarContenidos(): void {
    this.loadingContenidos = true;
    this.errorContenidos = null;
    this.cdr.markForCheck();

    this.contenidoApi.listPublic().subscribe({
      next: (items: any[]) => {
        const mapped: ClienteContenidoCard[] = (items ?? []).map((c: any) => ({
          idContenido: c.idContenidoEducativo,
          titulo: this.stripHtml(c.titulo, 'Sin título'),
          fechaPublicacion: c.fechaPublicacion,
          descripcionCorta: '',
          etiqueta: 'Educación',
        }));

        // Orden DESC por id
        mapped.sort((a, b) => (b.idContenido || 0) - (a.idContenido || 0));

        this.contenidoRecomendado = mapped.length > 0 ? mapped[0] : null;

        const recId = this.contenidoRecomendado?.idContenido;
        this.contenidos = mapped.filter((x) => x.idContenido !== recId).slice(0, 4);

        this.loadingContenidos = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando contenidos públicos', err);
        this.contenidoRecomendado = null;
        this.contenidos = [];
        this.loadingContenidos = false;
        this.errorContenidos = 'No se pudieron cargar los contenidos.';
        this.cdr.markForCheck();
      },
    });
  }

  private cargarEncuestas(): void {
    this.loadingEncuestas = true;
    this.errorEncuestas = null;
    this.cdr.markForCheck();

    // pedir activas + orden desc
    const baseParams = {
      limit: 50,
      offset: 0,
      activa: true,
      sortBy: 'idEncuesta' as const,
      order: 'desc' as const,
    };

    const doRequest = (useParams: any | null) => this.encuestaApi.list(useParams ?? {});

    doRequest(baseParams).subscribe({
      next: (resp: any) => {
        const src: any[] = Array.isArray(resp)
          ? resp
          : Array.isArray(resp?.items)
          ? resp.items
          : [];

        const mapped: ClienteEncuestaCard[] = src
          .map((e: EncuestaItem) => ({
            idEncuesta: (e as any).idEncuesta,
            titulo: this.stripHtml((e as any).titulo ?? 'Sin título', 'Sin título'),
            fechaPublicacion: (e as any).fechaPublicacion,
            fechaCierre: (e as any).fechaCierre ?? null,
            activa: !!(e as any).activa,
          }))
          .filter((e) => e.activa);

        mapped.sort((a, b) => {
          const ida = a.idEncuesta || 0;
          const idb = b.idEncuesta || 0;
          if (idb !== ida) return idb - ida;

          const ta = new Date(a.fechaPublicacion).getTime() || 0;
          const tb = new Date(b.fechaPublicacion).getTime() || 0;
          return tb - ta;
        });

        this.encuestas = mapped.slice(0, 3);
        this.loadingEncuestas = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        // Reintento sin params
        const msg = err?.error?.message;
        const is400 = err?.status === 400;
        const complainsParams =
          Array.isArray(msg) && msg.some((m: string) => /property .* should not exist/i.test(m));

        if (is400 && complainsParams) {
          doRequest(null).subscribe({
            next: (resp2: any) => {
              const src2: any[] = Array.isArray(resp2)
                ? resp2
                : Array.isArray(resp2?.items)
                ? resp2.items
                : [];

              const mapped2: ClienteEncuestaCard[] = src2
                .map((e: any) => ({
                  idEncuesta: e.idEncuesta,
                  titulo: this.stripHtml(e.titulo ?? 'Sin título', 'Sin título'),
                  fechaPublicacion: e.fechaPublicacion,
                  fechaCierre: e.fechaCierre ?? null,
                  activa: !!e.activa,
                }))
                .filter((e) => e.activa);

              mapped2.sort((a, b) => (b.idEncuesta || 0) - (a.idEncuesta || 0));
              this.encuestas = mapped2.slice(0, 3);

              this.loadingEncuestas = false;
              this.cdr.markForCheck();
            },
            error: (err2) => {
              console.error('Error cargando encuestas (reintento sin params)', err2);
              this.encuestas = [];
              this.loadingEncuestas = false;
              this.errorEncuestas = 'No se pudieron cargar las encuestas.';
              this.cdr.markForCheck();
            },
          });
        } else {
          console.error('Error cargando encuestas', err);
          this.encuestas = [];
          this.loadingEncuestas = false;
          this.errorEncuestas = 'No se pudieron cargar las encuestas.';
          this.cdr.markForCheck();
        }
      },
    });
  }
}