import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { DesafioApi, DesafioItem } from '../../../api/desafio.api';
import { InscripcionApi, InscripcionDesafioItem } from '../../../api/inscripcion.api';

interface MisDesafioRow {
  idDesafio: number;
  idInscripcionDesafio: number;
  titulo: string;
  tipoResiduo: string;
  meta: number;
  unidadMedida: string;
  estado: 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
  fechaAdhesion: string;
  progreso: number;
  puntosAcumulados: number;
}

@Component({
  selector: 'app-mis-desafios',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './mis-desafios.component.html',
  styleUrls: ['./mis-desafios.component.scss'],
})
export class MisDesafiosComponent implements OnInit {
  loading = false;
  errorMsg: string | null = null;

  items: MisDesafioRow[] = [];

  constructor(
    private readonly desafioApi: DesafioApi,
    private readonly inscripcionApi: InscripcionApi,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    forkJoin({
      desafios: this.desafioApi.listDesafios({
        limit: 100,
        sortBy: 'idDesafio',
        order: 'desc',
      }),
      inscripciones: this.inscripcionApi.list({
        limit: 100,
      }),
    }).subscribe({
      next: ({ desafios, inscripciones }) => {
        const desafiosItems = (desafios.items ?? []) as DesafioItem[];
        const inscripcionesItems = (inscripciones.items ?? []) as InscripcionDesafioItem[];

        const mapaDesafios = new Map<number, DesafioItem>();
        for (const d of desafiosItems) {
          mapaDesafios.set(d.idDesafio, d);
        }

        this.items = inscripcionesItems
          .map((ins) => {
            const desafio = mapaDesafios.get(ins.idDesafio);
            if (!desafio) return null;

            return {
              idDesafio: desafio.idDesafio,
              idInscripcionDesafio: ins.idInscripcionDesafio,
              titulo: this.getTextoPlano(desafio.titulo),
              tipoResiduo: desafio.tipoResiduo || '-',
              meta: this.toSafeNumber(desafio.meta),
              unidadMedida: desafio.unidadMedida || '-',
              estado: this.estadoToLabel(ins.estado),
              fechaAdhesion: ins.fechaAdhesion,
              progreso: this.toSafeNumber(ins.progreso),
              puntosAcumulados: Number(ins.puntosAcumulados ?? 0),
            } as MisDesafioRow;
          })
          .filter((x): x is MisDesafioRow => !!x)
          .sort((a, b) => {
            const aDate = new Date(a.fechaAdhesion).getTime();
            const bDate = new Date(b.fechaAdhesion).getTime();
            return bDate - aDate;
          });

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando mis desafíos', err);
        this.items = [];
        this.loading = false;
        this.errorMsg = 'No fue posible cargar tus desafíos en este momento.';
        this.cdr.detectChanges();
      },
    });
  }

  trackById(_: number, item: MisDesafioRow): number {
    return item.idInscripcionDesafio;
  }

  onVolver(): void {
    this.router.navigate(['/menu-principal', 'cliente', 'desafios']);
  }

  onVerDetalle(item: MisDesafioRow): void {
    this.router.navigate(
      ['/menu-principal', 'cliente', 'desafios', 'ver', item.idDesafio],
      { state: { item, from: 'mis-desafios' } }
    );
  }

  getEstadoClase(estado: string): string {
    switch (estado) {
      case 'ACTIVO':
        return 'badge--ok';
      case 'PAUSADO':
        return 'badge--warn';
      case 'FINALIZADO':
        return 'badge--muted';
      default:
        return 'badge--muted';
    }
  }

  getProgressWidth(value: number): string {
    const safe = Math.max(0, Math.min(100, Number(value || 0)));
    return `${safe}%`;
  }

  private estadoToLabel(estado: number): 'ACTIVO' | 'PAUSADO' | 'FINALIZADO' {
    switch (Number(estado)) {
      case 1:
        return 'ACTIVO';
      case 2:
        return 'PAUSADO';
      case 3:
        return 'FINALIZADO';
      default:
        return 'ACTIVO';
    }
  }

  private toSafeNumber(value: unknown): number {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    return n;
  }

  private getTextoPlano(texto: string | null | undefined): string {
    if (!texto) return 'Sin título';
    const limpio = texto.replace(/<[^>]+>/g, '').trim();
    return limpio || 'Sin título';
  }
}