import { Component, OnInit, OnDestroy, inject, signal, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subject, of, combineLatest } from 'rxjs';
import { catchError, debounceTime, finalize, map, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { DesafioApi, DesafioItem, DesafioListParams, DesafioSummaryResponse } from '../../../../api/desafio.api';

type FiltroEstado = 'todos' | 'activo' | 'pausado' | 'finalizado';

@Component({
  selector: 'app-desafios-administrador',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './desafios-admin.component.html',
  styleUrls: ['./desafios-admin.component.scss'],
})
export class DesafiosAdministradorComponent implements OnInit, OnDestroy {
  private api = inject(DesafioApi);
  private router = inject(Router); 
  private host = inject(ElementRef<HTMLElement>);
  private destroy$ = new Subject<void>();

  // --- KPIs
  summary = signal<DesafioSummaryResponse | null>(null);
  loadingSummary = signal<boolean>(false);
  errorSummary = signal<boolean>(false); // flag genérico (sin detalle crudo)

  // --- Filtros rápidos: SOLO buscar + estado
  q = signal<string>('');
  filtroEstado = signal<FiltroEstado>('todos');

  // --- Resultados (widget "últimos 10")
  latest = signal<DesafioItem[]>([]);
  loadingLatest = signal<boolean>(false);
  errorLatest = signal<boolean>(false); // flag genérico (sin detalle crudo)

  // --- Triggers
  private refreshSummary$ = new Subject<void>();
  private refreshLatest$ = new Subject<void>();

  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent) {
    const root = this.host.nativeElement;
    if (!root.contains(ev.target as Node)) {
      // no custom menus acá, mantenemos patrón
    }
  }

  private stripHtml(html: string | null | undefined): string {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  ngOnInit(): void {
    // KPIs
    this.refreshSummary$
      .pipe(
        startWith(void 0),
        switchMap(() => {
          this.loadingSummary.set(true);
          this.errorSummary.set(false);
          return this.api.getSummary().pipe(
            catchError(() => {
              this.errorSummary.set(true);
              return of(null);
            }),
            finalize(() => this.loadingSummary.set(false))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(res => this.summary.set(res));

    // “Últimos 10” (respeta q + estado)
    combineLatest([
      this.refreshLatest$.pipe(startWith(void 0)),
      of(null).pipe(
        switchMap(() => of({ q: this.q(), estado: this.filtroEstado() }).pipe(debounceTime(50)))
      ),
    ])
      .pipe(
        switchMap(() => {
          this.loadingLatest.set(true);
          this.errorLatest.set(false);

          const params: DesafioListParams = {
            limit: 10,
            offset: 0,
            sortBy: 'idDesafio',
            order: 'desc',
          };
          const est = this.filtroEstado();
          if (est !== 'todos') {
            params.estado = est === 'activo' ? 1 : (est === 'pausado' ? 2 : 3);
          }
          const term = this.q().trim();
          if (term) params.q = term;

          return this.api.listDesafios(params).pipe(
            map(r => r.items ?? []),
            catchError(() => {
              this.errorLatest.set(true);
              return of([]);
            }),
            finalize(() => this.loadingLatest.set(false))
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(items => {
        // Normalizamos para búsqueda local: quitar HTML en título/descr.
        const term = this.q().trim().toLowerCase();
        const plain = items.map(i => ({
          ...i,
          titulo: this.stripHtml(i.titulo),
          descripcion: this.stripHtml(i.descripcion),
        }));

        // Filtro local por q (por si el backend no filtra)
        const filtered = term
          ? plain.filter(i =>
              (i.titulo || '').toLowerCase().includes(term) ||
              (i.descripcion || '').toLowerCase().includes(term)
            )
          : plain;

        this.latest.set(filtered);
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // === Toolbar actions
  onLimpiar() {
    this.q.set('');
    this.filtroEstado.set('todos');
    this.refreshLatest$.next();
  }
  onVerTodos() {
    this.router.navigate(['/menu-principal/admin/desafios/listado']); // ajusta si tu ruta difiere
  }
  onNuevo() {
    this.router.navigate(['/menu-principal/admin/desafios/nuevo']);
  }

  onVer(d: DesafioItem) {
    this.router.navigate(
      ['/menu-principal','admin','desafios','ver', d.idDesafio],
      { state: { item: d, from: 'dashboard' } }
    );
  }

  onEditar(d: DesafioItem) {
    this.router.navigate(
      ['/menu-principal','admin','desafios','editar', d.idDesafio],
      { state: { item: d, from: 'dashboard' } }
    );
  }

  // === Filtros handlers
  onBuscar(value: string) {
    this.q.set(value.trim());
    this.refreshLatest$.next();
  }
  onEstadoChange(value: string) {
    const v = (value as FiltroEstado) || 'todos';
    this.filtroEstado.set(v);
    this.refreshLatest$.next();
  }

  // === UI helpers
  estadoBadge(item: DesafioItem): { text: string; cls: string } {
    switch (item.estado) {
      case 1: return { text: 'ACTIVO',     cls: 'dsf-badge dsf-badge--ok' };
      case 2: return { text: 'PAUSADO',    cls: 'dsf-badge dsf-badge--warn' };
      case 3: return { text: 'FINALIZADO', cls: 'dsf-badge dsf-badge--muted' };
      default: return { text: String(item.estado), cls: 'dsf-badge' };
    }
  }

  trackById = (i: number, d: DesafioItem) => d.idDesafio;
}
