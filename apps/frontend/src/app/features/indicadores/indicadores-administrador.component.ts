import { Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { UsuariosApi, UsuarioDto } from '../../api/usuarios.api';
import { DesafioApi, DesafioSummaryResponse } from '../../api/desafio.api';
import { VoucherApi } from '../../api/voucher.api';
import { EntregasApi, EstadoEntregaCode } from '../../api/entrega.api';

type Rol = 'ADMIN' | 'OPERARIO' | 'CLIENTE';

type EstadoVoucherLabel = 'CREADO' | 'ADQUIRIDO' | 'UTILIZADO' | 'ANULADO';

@Component({
  selector: 'app-indicadores-administrador',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './indicadores-administrador.component.html',
  styleUrls: ['./indicadores-administrador.component.scss'],
})
export class IndicadoresAdministradorComponent {
  constructor(
    private usuariosApi: UsuariosApi,
    private desafioApi: DesafioApi,
    private voucherApi: VoucherApi,
    private entregasApi: EntregasApi
  ) {}

  rangoDias = signal<number>(90);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  usuariosAll = signal<UsuarioDto[]>([]);
  desafiosSummary = signal<DesafioSummaryResponse | null>(null);

  vouchersPorEstado = signal<Record<EstadoVoucherLabel, number>>({
    CREADO: 0,
    ADQUIRIDO: 0,
    UTILIZADO: 0,
    ANULADO: 0,
  });

  vouchersTotal = computed(() => {
    const v = this.vouchersPorEstado();
    return (v.CREADO ?? 0) + (v.ADQUIRIDO ?? 0) + (v.UTILIZADO ?? 0) + (v.ANULADO ?? 0);
  });

  entregasPorEstado = signal<Record<string, number>>({
    CREADA: 0,
    PENDIENTE: 0,
    VALIDADA: 0,
    RECHAZADA: 0,
    PUNTOS_OTORGADOS: 0,
    ANULADA: 0,
  });

  entregasTotalRango = computed(() => {
    const e = this.entregasPorEstado();
    return Object.values(e).reduce((a, b) => a + (Number(b) || 0), 0);
  });

  desafiosCreadosRango = signal<number>(0);

  totalUsuarios = computed(() => this.usuariosAll().length);

  totalPorRol = computed<Record<Rol, number>>(() => {
    const arr = this.usuariosAll();
    const out: Record<Rol, number> = { ADMIN: 0, OPERARIO: 0, CLIENTE: 0 };

    for (const u of arr) {
      const rol = this.mapRol(u.idRolUsuario);
      out[rol] = (out[rol] ?? 0) + 1;
    }
    return out;
  });

  formatInt(n: number): string {
    return new Intl.NumberFormat('es-AR').format(Math.round(Number(n) || 0));
  }

  private ymd(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private getRangoFechas(): { desde: string; hasta: string } {
    const hastaD = new Date();
    const desdeD = new Date();
    desdeD.setDate(desdeD.getDate() - this.rangoDias() + 1);

    const desdeIso = `${this.ymd(desdeD)}T00:00:00.000Z`;
    const hastaIso = `${this.ymd(hastaD)}T23:59:59.999Z`;

    return { desde: desdeIso, hasta: hastaIso };
  }

  ngOnInit(): void {
    this.refresh();
  }

  onRangoChange(v: string) {
    const n = Number(v);
    if (n === 30 || n === 90 || n === 180) {
      this.rangoDias.set(n);
      this.refresh();
    }
  }

  refresh(): void {
    this.loading.set(true);
    this.error.set(null);

    const { desde, hasta } = this.getRangoFechas();

    const usuarios$ = this.usuariosApi.fetchAllForCounters().pipe(
      catchError(() => of([] as UsuarioDto[]))
    );

    const desafiosSummary$ = this.desafioApi.getSummary().pipe(
      catchError(() => of(null))
    );

    const desafiosRango$ = this.desafioApi.listDesafios({
      limit: 1,
      offset: 0,
      fechaDesde: this.ymd(new Date(desde)),
      fechaHasta: this.ymd(new Date(hasta)),
    } as any).pipe(
      catchError(() => of({ total: 0 } as any))
    );

    const vCreado$ = this.voucherApi
      .list({ limit: 1, offset: 0, idEstadoVoucher: 1 } as any)
      .pipe(catchError(() => of({ total: 0 } as any)));

    const vAdq$ = this.voucherApi
      .list({ limit: 1, offset: 0, idEstadoVoucher: 2 } as any)
      .pipe(catchError(() => of({ total: 0 } as any)));

    const vUtil$ = this.voucherApi
      .list({ limit: 1, offset: 0, idEstadoVoucher: 3 } as any)
      .pipe(catchError(() => of({ total: 0 } as any)));

    const vAnu$ = this.voucherApi
      .list({ limit: 1, offset: 0, idEstadoVoucher: 4 } as any)
      .pipe(catchError(() => of({ total: 0 } as any)));

    const e = (estado: EstadoEntregaCode) =>
      this.entregasApi.list({ limit: 1, offset: 0, estado, fechaDesde: desde, fechaHasta: hasta }).pipe(
        catchError(() => of({ total: 0 } as any))
      );

    forkJoin({
      usuarios: usuarios$,
      desafiosSummary: desafiosSummary$,
      desafiosRango: desafiosRango$,

      v1: vCreado$,
      v2: vAdq$,
      v3: vUtil$,
      v4: vAnu$,

      e1: e(1),
      e2: e(2),
      e3: e(3),
      e4: e(4),
      e5: e(5),
      e6: e(6),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (r) => {
          this.usuariosAll.set(r.usuarios ?? []);
          this.desafiosSummary.set(r.desafiosSummary ?? null);

          this.desafiosCreadosRango.set(Number((r as any).desafiosRango?.total ?? 0));

          this.vouchersPorEstado.set({
            CREADO: Number((r as any).v1?.total ?? 0),
            ADQUIRIDO: Number((r as any).v2?.total ?? 0),
            UTILIZADO: Number((r as any).v3?.total ?? 0),
            ANULADO: Number((r as any).v4?.total ?? 0),
          });

          this.entregasPorEstado.set({
            CREADA: Number((r as any).e1?.total ?? 0),
            PENDIENTE: Number((r as any).e2?.total ?? 0),
            VALIDADA: Number((r as any).e3?.total ?? 0),
            RECHAZADA: Number((r as any).e4?.total ?? 0),
            PUNTOS_OTORGADOS: Number((r as any).e5?.total ?? 0),
            ANULADA: Number((r as any).e6?.total ?? 0),
          });
        },
        error: () => {
          this.error.set('No se pudieron cargar los indicadores.');
        },
      });
  }

  private mapRol(idRolUsuario: number): Rol {
    if (Number(idRolUsuario) === 1) return 'ADMIN';
    if (Number(idRolUsuario) === 2) return 'OPERARIO';
    return 'CLIENTE';
  }

  pct(part: number, total: number): number {
    const t = Number(total) || 0;
    if (!t) return 0;
    return ((Number(part) || 0) * 100) / t;
  }

  private escapeCsv(value: unknown): string {
    return `"${String(value ?? '').replace(/"/g, '""')}"`;
  }

  private downloadCsv(filename: string, rows: unknown[][]): void {
    const csv = rows.map((row) => row.map((v) => this.escapeCsv(v)).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async fetchAllPaginated<T>(
    fetchPage: (limit: number, offset: number) => Promise<{ items?: T[]; total?: number }>
  ): Promise<T[]> {
    const first = await fetchPage(1, 0);
    const total = Number(first?.total ?? 0);

    if (!total) return [];

    const full = await fetchPage(total, 0);
    return Array.isArray(full?.items) ? full.items : [];
  }

  async exportUsuariosCSV(): Promise<void> {
    try {
      const items = await firstValueFrom(
        this.usuariosApi.fetchAllForCounters().pipe(catchError(() => of([] as UsuarioDto[])))
      );

      const rows: unknown[][] = [
        ['ID Usuario', 'Usuario', 'Email', 'DNI/CUIT/CUIL', 'Rol', 'Estado'],
        ...(items ?? []).map((u: any) => [
          u.idUsuario ?? '',
          u.usuario ?? '',
          u.email ?? '',
          u.dniCuitCuil ?? '',
          this.mapRol(u.idRolUsuario),
          Number(u.idEstadoUsuario) === 3 ? 'BANEADO' : Number(u.idEstadoUsuario) === 2 ? 'HABILITADO' : 'PENDIENTE',
        ]),
      ];

      this.downloadCsv(`usuarios_admin_${this.ymd(new Date())}.csv`, rows);
    } catch {
      alert('No se pudo exportar usuarios.');
    }
  }

  async exportDesafiosCSV(): Promise<void> {
    try {
      const items = await this.fetchAllPaginated<any>(async (limit, offset) => {
        return await firstValueFrom(
          this.desafioApi.listDesafios({
            limit,
            offset,
            sortBy: 'idDesafio',
            order: 'desc',
          } as any).pipe(catchError(() => of({ items: [], total: 0 } as any)))
        );
      });

      const rows: unknown[][] = [
        ['ID Desafío', 'Título', 'Estado', 'Fecha inicio', 'Fecha fin', 'Requiere inscripción'],
        ...items.map((d: any) => [
          d.idDesafio ?? '',
          d.titulo ?? '',
          Number(d.estado) === 1 ? 'ACTIVO' : Number(d.estado) === 2 ? 'PAUSADO' : 'FINALIZADO',
          d.fechaInicio ?? '',
          d.fechaFin ?? '',
          d.requiereInscripcion ? 'Sí' : 'No',
        ]),
      ];

      this.downloadCsv(`desafios_admin_${this.ymd(new Date())}.csv`, rows);
    } catch {
      alert('No se pudo exportar desafíos.');
    }
  }

  async exportVouchersCSV(): Promise<void> {
    try {
      const items = await this.fetchAllPaginated<any>(async (limit, offset) => {
        return await firstValueFrom(
          this.voucherApi.list({
            limit,
            offset,
          } as any).pipe(catchError(() => of({ items: [], total: 0 } as any)))
        );
      });

      const rows: unknown[][] = [
        ['ID Voucher', 'ID Cliente', 'ID Tipo', 'Estado', 'Fecha adquisición', 'Fecha uso'],
        ...items.map((v: any) => [
          v.idVoucher ?? '',
          v.idCliente ?? '',
          v.idVoucherTipo ?? '',
          Number(v.estadoVoucher) === 1
            ? 'CREADO'
            : Number(v.estadoVoucher) === 2
              ? 'ADQUIRIDO'
              : Number(v.estadoVoucher) === 3
                ? 'UTILIZADO'
                : 'ANULADO',
          v.fechaAdquisicion ?? '',
          v.fechaUso ?? '',
        ]),
      ];

      this.downloadCsv(`vouchers_admin_${this.ymd(new Date())}.csv`, rows);
    } catch {
      alert('No se pudo exportar vouchers.');
    }
  }

  async exportEntregasCSV(): Promise<void> {
    try {
      const items = await this.fetchAllPaginated<any>(async (limit, offset) => {
        return await firstValueFrom(
          this.entregasApi.list({
            limit,
            offset,
            sortBy: 'idEntrega',
            order: 'desc',
          }).pipe(catchError(() => of({ items: [], total: 0 } as any)))
        );
      });

      const rows: unknown[][] = [
        [
          'ID Entrega',
          'ID Cliente',
          'ID Desafío',
          'ID Inscripción',
          'Estado',
          'Fecha creación',
          'Fecha vencimiento',
          'Fecha validación',
          'Cantidad declarada',
          'Cantidad verificada',
          'Ubicación',
          'Observaciones',
          'Motivo rechazo',
        ],
        ...items.map((e: any) => [
          e.idEntrega ?? '',
          e.idCliente ?? '',
          e.idDesafio ?? '',
          e.idInscripcionDesafio ?? '',
          Number(e.estado) === 1
            ? 'CREADA'
            : Number(e.estado) === 2
              ? 'PENDIENTE'
              : Number(e.estado) === 3
                ? 'VALIDADA'
                : Number(e.estado) === 4
                  ? 'RECHAZADA'
                  : Number(e.estado) === 5
                    ? 'PUNTOS OTORGADOS'
                    : 'ANULADA',
          e.fechaCreacion ?? '',
          e.fechaVencimiento ?? '',
          e.fechaValidacion ?? '',
          e.cantidadDeclarada ?? '',
          e.cantidadVerificada ?? '',
          e.ubicacion ?? '',
          e.observaciones ?? '',
          e.motivoRechazo ?? '',
        ]),
      ];

      this.downloadCsv(`entregas_admin_${this.ymd(new Date())}.csv`, rows);
    } catch {
      alert('No se pudo exportar entregas.');
    }
  }

  exportResumenCSV(): void {
    const rows: unknown[][] = [
      ['Entidad', 'Métrica', 'Detalle'],
      [
        'Entregas',
        this.entregasTotalRango(),
        `Pendientes ${this.entregasPorEstado()['PENDIENTE']}, Validadas ${this.entregasPorEstado()['VALIDADA']}, Rechazadas ${this.entregasPorEstado()['RECHAZADA']}, Puntos ${this.entregasPorEstado()['PUNTOS_OTORGADOS']}`,
      ],
      [
        'Desafíos',
        this.desafiosCreadosRango(),
        `Activos ${this.desafiosSummary()?.activos ?? 0}, Pausados ${this.desafiosSummary()?.pausados ?? 0}, Finalizados ${this.desafiosSummary()?.finalizados ?? 0}`,
      ],
      [
        'Usuarios',
        this.totalUsuarios(),
        `Admin ${this.totalPorRol().ADMIN}, Operario ${this.totalPorRol().OPERARIO}, Cliente ${this.totalPorRol().CLIENTE}`,
      ],
      [
        'Vouchers',
        this.vouchersTotal(),
        `Creados ${this.vouchersPorEstado().CREADO}, Adquiridos ${this.vouchersPorEstado().ADQUIRIDO}, Utilizados ${this.vouchersPorEstado().UTILIZADO}, Anulados ${this.vouchersPorEstado().ANULADO}`,
      ],
    ];

    this.downloadCsv(`indicadores_resumen_${this.ymd(new Date())}.csv`, rows);
  }
}