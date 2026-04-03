import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClienteApi, ClienteDto } from '../../../api/cliente.api';
import { ProvinciaApi } from '../../../api/provincia.api';
import { LocalidadApi } from '../../../api/localidad.api';

type Rol = 'admin' | 'operario' | 'cliente';

export interface UsuarioViewVM {
  id: number;                    // idUsuario (y para cliente = idCliente)
  idCliente?: number | null;      // lo podés seguir mostrando si ya lo tenés
  nombreUsuario: string;
  propietario: string;
  dniCuitCuil: string;
  email: string;
  tipo: Rol;
  estadoId: 1 | 2 | 3;
  motivoBan?: string | null;
}

interface ClienteExtraVM {
  razonSocial?: string | null;
  direccion?: string | null;
  idProvincia?: number | null;
  idLocalidad?: number | null;
  idTipoCliente?: number | null;
  puntos?: number | null;

  provinciaNombre?: string | null;
  localidadNombre?: string | null;
}

@Component({
  standalone: true,
  selector: 'app-usuario-view-dialog',
  imports: [CommonModule],
  templateUrl: './usuario-view-dialog.component.html',
  styleUrls: ['./usuario-view-dialog.component.scss'],
})
export class UsuarioViewDialogComponent implements OnChanges {
  private readonly clienteApi = inject(ClienteApi);
  private readonly provinciaApi = inject(ProvinciaApi);
  private readonly localidadApi = inject(LocalidadApi);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() usuario!: UsuarioViewVM;
  @Output() close = new EventEmitter<void>();

  nombres = '';
  apellidos = '';

  clienteLoading = false;
  clienteError: string | null = null;
  clienteExtra: ClienteExtraVM | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuario'] && this.usuario) {
      // split nombres/apellidos
      const full = (this.usuario.propietario || '').trim();
      if (!full) {
        this.nombres = '';
        this.apellidos = '';
      } else {
        const parts = full.split(/\s+/);
        this.nombres = parts.length > 1 ? parts.slice(0, -1).join(' ') : '';
        this.apellidos = parts.length > 0 ? parts.slice(-1).join(' ') : '';
      }

      // reset estado cliente
      this.clienteExtra = null;
      this.clienteError = null;
      this.clienteLoading = false;

      // cargar si corresponde
      this.maybeLoadClienteExtra();

      // por si el modal abre con OnPush, aseguramos render del reset inmediato
      this.cdr.markForCheck();
    }
  }

  private maybeLoadClienteExtra(): void {
    if (this.usuario?.tipo !== 'cliente') return;

    // regla: idUsuario = idCliente
    const idCliente = Number(this.usuario?.id ?? 0);
    if (!idCliente || idCliente <= 0) return;

    this.clienteLoading = true;
    this.clienteError = null;
    this.cdr.markForCheck();

    this.clienteApi.getById(idCliente).subscribe({
      next: (cli: ClienteDto) => {
        const idProv = Number(cli?.idProvincia);
        const idLoc = Number(cli?.idLocalidad);

        this.clienteExtra = {
          razonSocial: cli?.razonSocial ?? null,
          direccion: cli?.direccion ?? null,
          idProvincia: Number.isFinite(idProv) ? idProv : null,
          idLocalidad: Number.isFinite(idLoc) ? idLoc : null,
          idTipoCliente: cli?.idTipoCliente ?? null,
          puntos: Number.isFinite(Number(cli?.puntos)) ? Number(cli.puntos) : null,
          provinciaNombre: null,
          localidadNombre: null,
        };

        this.clienteLoading = false;
        this.cdr.markForCheck(); // ✅ pinta datos del cliente sin click

        // Resolver provincia/localidad (en paralelo)
        this.loadProvinciaNombre(idProv);
        this.loadLocalidadNombre(idLoc);
      },
      error: (err: any) => {
        console.error('[UsuarioView] Error cargando cliente extra', err);
        this.clienteLoading = false;
        this.clienteError = 'No se pudieron cargar los datos del cliente.';
        this.cdr.markForCheck(); // ✅ muestra error sin click
      },
    });
  }

  private loadProvinciaNombre(idProv: number): void {
    if (!Number.isFinite(idProv) || idProv <= 0) return;

    this.provinciaApi.getById(idProv).subscribe({
      next: (p: any) => {
        if (!this.clienteExtra) return;
        this.clienteExtra.provinciaNombre = (p?.nombre ?? null);
        this.cdr.markForCheck(); // ✅ refresca cuando llega provincia
      },
      error: () => {
        if (!this.clienteExtra) return;
        this.clienteExtra.provinciaNombre = null;
        this.cdr.markForCheck();
      },
    });
  }

  private loadLocalidadNombre(idLoc: number): void {
    if (!Number.isFinite(idLoc) || idLoc <= 0) return;

    this.localidadApi.getById(idLoc).subscribe({
      next: (l: any) => {
        if (!this.clienteExtra) return;
        // tu backend localidad.findOne devuelve un objeto que incluye "nombre" (normalmente)
        this.clienteExtra.localidadNombre = (l?.nombre ?? null);
        this.cdr.markForCheck(); // ✅ refresca cuando llega localidad
      },
      error: () => {
        if (!this.clienteExtra) return;
        this.clienteExtra.localidadNombre = null;
        this.cdr.markForCheck();
      },
    });
  }

  get tipoClienteLabel(): string {
    const t = this.clienteExtra?.idTipoCliente ?? null;
    if (t === 1) return 'Ciudadano';
    if (t === 2) return 'PYME/Empresa';
    if (t === 3) return 'Institución';
    return '—';
  }

  cancel() { this.close.emit(); }
}
