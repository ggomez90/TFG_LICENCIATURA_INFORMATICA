import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { DesafioApi, DesafioItem } from '../../../../api/desafio.api';
import { InscripcionApi, InscripcionDesafioItem } from '../../../../api/inscripcion.api';

interface MisDesafioCard {
  idDesafio: number;
  titulo: string;
  descripcion: string;
  tipoResiduo: string;
  fechaInicio: string;
  fechaFin?: string | null;
  progreso: number;
  puntosAcumulados: number;
  estado: 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
}

interface ExplorarDesafioCard {
  idDesafio: number;
  titulo: string;
  descripcion: string;
  tipoResiduo: string;
  fechaInicio: string;
  fechaFin?: string | null;
  requiereInscripcion: boolean;
  puntosTotales: number;
  estado: 'ACTIVO' | 'PAUSADO' | 'FINALIZADO';
  yaInscripto: boolean;
}

@Component({
  selector: 'app-desafios-cliente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './desafios-cliente.component.html',
  styleUrls: ['./desafios-cliente.component.scss'],
})
export class DesafiosClienteComponent implements OnInit {
  loading = false;

  resumen = {
    misDesafios: 0,
    activos: 0,
    completados: 0,
    puntosAcumulados: 0,
  };

  desafioDestacado: ExplorarDesafioCard | null = null;

  misDesafios: MisDesafioCard[] = [];
  explorarDesafios: ExplorarDesafioCard[] = [];

  constructor(
    private readonly router: Router,
    private readonly desafioApi: DesafioApi,
    private readonly inscripcionApi: InscripcionApi,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  private cargar(): void {
    this.loading = true;
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

        const mapaInscripcionesPorDesafio = new Map<number, InscripcionDesafioItem>();
        for (const ins of inscripcionesItems) {
          mapaInscripcionesPorDesafio.set(ins.idDesafio, ins);
        }

        const desafiosOrdenados = [...desafiosItems].sort((a, b) => b.idDesafio - a.idDesafio);

        this.misDesafios = inscripcionesItems
          .map((ins) => {
            const desafio = desafiosOrdenados.find((d) => d.idDesafio === ins.idDesafio);
            if (!desafio) return null;

            return {
              idDesafio: desafio.idDesafio,
              titulo: this.getTituloPlano(desafio.titulo),
              descripcion: this.getTextoPlano(desafio.descripcion),
              tipoResiduo: desafio.tipoResiduo,
              fechaInicio: desafio.fechaInicio,
              fechaFin: desafio.fechaFin,
              progreso: this.toSafeNumber(ins.progreso),
              puntosAcumulados: Number(ins.puntosAcumulados ?? 0),
              estado: this.estadoToLabel(ins.estado),
            } as MisDesafioCard;
          })
          .filter((x): x is MisDesafioCard => !!x)
          .sort((a, b) => {
            const aDate = new Date(a.fechaInicio).getTime();
            const bDate = new Date(b.fechaInicio).getTime();
            return bDate - aDate;
          })
          .slice(0, 3);

        this.explorarDesafios = desafiosOrdenados
          .map((d) => ({
            idDesafio: d.idDesafio,
            titulo: this.getTituloPlano(d.titulo),
            descripcion: this.getTextoPlano(d.descripcion),
            tipoResiduo: d.tipoResiduo,
            fechaInicio: d.fechaInicio,
            fechaFin: d.fechaFin,
            requiereInscripcion: !!d.requiereInscripcion,
            puntosTotales: Number(d.puntosTotales ?? 0),
            estado: this.estadoToLabel(d.estado),
            yaInscripto: mapaInscripcionesPorDesafio.has(d.idDesafio),
          }))
          .slice(0, 3);

        const destacadosDisponibles = this.explorarDesafios.filter((d) => !d.yaInscripto);
        this.desafioDestacado = destacadosDisponibles[0] ?? this.explorarDesafios[0] ?? null;

        this.resumen = {
          misDesafios: inscripcionesItems.length,
          activos: inscripcionesItems.filter((i) => Number(i.estado) === 1).length,
          completados: inscripcionesItems.filter((i) => Number(i.estado) === 3).length,
          puntosAcumulados: inscripcionesItems.reduce(
            (acc, i) => acc + Number(i.puntosAcumulados ?? 0),
            0
          ),
        };

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando dashboard de desafíos cliente', err);
        this.loading = false;
        this.misDesafios = [];
        this.explorarDesafios = [];
        this.desafioDestacado = null;
        this.resumen = {
          misDesafios: 0,
          activos: 0,
          completados: 0,
          puntosAcumulados: 0,
        };
        this.cdr.detectChanges();
      },
    });
  }

  private toSafeNumber(value: unknown): number {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(100, n));
  }

  private getTextoPlano(texto: string | null | undefined): string {
    if (!texto) return 'Sin descripción';
    const limpio = texto.replace(/<[^>]+>/g, '').trim();
    return limpio || 'Sin descripción';
  }

  getTituloPlano(texto: string | null | undefined): string {
    if (!texto) return 'Sin título';
    const limpio = texto.replace(/<[^>]+>/g, '').trim();
    return limpio || 'Sin título';
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

  trackById(_: number, item: { idDesafio: number }): number {
    return item.idDesafio;
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

  onVerMisDesafios(): void {
    this.router.navigate(['/menu-principal', 'cliente', 'desafios', 'mis-desafios']);
  }

  onExplorarTodos(): void {
    this.router.navigate(['/menu-principal', 'cliente', 'desafios', 'listado']);
  }

  /*onVerDetalle(idDesafio: number): void {
    this.router.navigate(
      ['/menu-principal', 'cliente', 'desafios', 'ver', idDesafio],
      { state: { from: 'dashboard' } }
    );
  }*/

  onVerDetalle(d: ExplorarDesafioCard | MisDesafioCard): void {
    this.router.navigate(
      ['/menu-principal', 'cliente', 'desafios', 'ver', d.idDesafio],
      { state: { item: d, from: 'dashboard' } }
    );
  }

  onIniciarDesafio(idDesafio: number): void {
    this.router.navigate(
      ['/menu-principal', 'cliente', 'desafios', 'ver', idDesafio],
      { state: { from: 'dashboard', action: 'inscribirse' } }
    );
  }
}