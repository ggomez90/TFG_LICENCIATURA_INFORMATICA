// Yo_Reciclo\apps\frontend\src\app\features\perfil\editar-perfil.component.ts
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';

import { UsuariosApi, UsuarioDto, UpdateUsuarioDto } from '../../api/usuarios.api';
import { ClienteApi, ClienteDto, UpdateClienteDto } from '../../api/cliente.api';
import { ProvinciaApi, ProvinciaDto } from '../../api/provincia.api';
import { LocalidadApi, LocalidadDto } from '../../api/localidad.api';

type Rol = 'ADMIN' | 'OPERARIO' | 'CLIENTE';

type PerfilForm = {
  // usuario (editable)
  nombres: string;
  apellidos: string;
  dniCuitCuil: string;

  // usuario (no editable)
  email: string;
  usuario: string;
  rol: Rol;
  estado: boolean;

  // cliente (editable si CLIENTE)
  razonSocial: string;
  direccion: string;
  idProvincia: number | null;
  idLocalidad: number | null;
  idTipoCliente: number | null;

  // solo informativo
  puntos: number;
  idUsuario: number;
};

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, NgIf],
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.scss'],
})
export class EditarPerfilComponent {
  private usuariosApi = inject(UsuariosApi);
  private clienteApi = inject(ClienteApi);
  private provinciaApi = inject(ProvinciaApi);
  private localidadApi = inject(LocalidadApi);

  loading = signal(false);
  saving = signal(false);

  errorMsg = signal<string | null>(null);
  okMsg = signal<string | null>(null);

  me = signal<UsuarioDto | null>(null);
  cliente = signal<ClienteDto | null>(null);

  form = signal<PerfilForm | null>(null);

  provincias = signal<ProvinciaDto[]>([]);
  localidades = signal<LocalidadDto[]>([]);
  localidadesLoading = signal(false);

  isCliente = computed(() => this.form()?.rol === 'CLIENTE');
  isCliente2 = computed(() => this.mapRol(this.me()?.idRolUsuario ?? 0) === 'CLIENTE');

  ngOnInit(): void {
    this.load();
  }

  // LOAD
  private load(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set(null);
    this.okMsg.set(null);

    this.me.set(null);
    this.cliente.set(null);
    this.form.set(null);

    // 1) cargar /usuarios/me
    this.usuariosApi.me().pipe(
      switchMap((u) => {
        this.me.set(u);

        const rol = this.mapRol(u.idRolUsuario);

        // 2) si es cliente: /clientes/me
        if (rol === 'CLIENTE') {
          return this.clienteApi.me().pipe(
            map((cli) => ({ u, cli })),
            catchError((err) => {
              console.error('[EditarPerfil] /clientes/me error', err);
              return of({ u, cli: null as any });
            })
          );
        }

        return of({ u, cli: null as any });
      }),
      tap(({ u, cli }) => {
        this.cliente.set(cli ?? null);
        this.buildForm(u, cli ?? null);
      }),
      // 3) cargar provincias siempre
      switchMap(() => this.loadProvincias$()),
      finalize(() => this.loading.set(false)),
      catchError((err) => {
        console.error('[EditarPerfil] load error', err);
        this.errorMsg.set('No se pudieron cargar tus datos.');
        return of(null);
      })
    ).subscribe({
      next: () => {
        // 4) si ya hay provincia elegida, cargar localidades iniciales
        const prov = this.form()?.idProvincia ?? null;
        if (prov) this.loadLocalidadesByProvincia(prov);
      },
    });
  }

  private buildForm(u: UsuarioDto, cli: ClienteDto | null): void {
    const rol: Rol = this.mapRol(u.idRolUsuario);
    const estado = Number(u.idEstadoUsuario) === 2;

    const direccion = (cli?.direccion ?? u.cliente?.direccion ?? '') ?? '';
    const idProvincia = (cli?.idProvincia ?? u.cliente?.idProvincia ?? null) as any;
    const idLocalidad = (cli?.idLocalidad ?? u.cliente?.idLocalidad ?? null) as any;

    const puntos = Number(cli?.puntos ?? u.cliente?.puntos ?? 0);

    this.form.set({
      nombres: String(u.nombres ?? ''),
      apellidos: String(u.apellidos ?? ''),
      dniCuitCuil: String(u.dniCuitCuil ?? ''),

      email: String(u.email ?? ''),
      usuario: String(u.usuario ?? ''),
      rol,
      estado,

      razonSocial: String(cli?.razonSocial ?? u.cliente?.razonSocial ?? ''),
      direccion: String(direccion ?? ''),
      idProvincia: (Number.isFinite(Number(idProvincia)) && Number(idProvincia) > 0) ? Number(idProvincia) : null,
      idLocalidad: (Number.isFinite(Number(idLocalidad)) && Number(idLocalidad) > 0) ? Number(idLocalidad) : null,
      idTipoCliente: (cli?.idTipoCliente ?? u.cliente?.idTipoCliente ?? null) as any,

      puntos,
      idUsuario: Number(u.idUsuario),
    });
  }

  // Provincias / Localidades

  private loadProvincias$() {
    return this.provinciaApi.getAll({ page: 1, pageSize: 100 }).pipe(
      map((resp: any) => {
          const data = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
          return (data as any[]).map(x => ({
          idProvincia: Number(x.idProvincia),
          nombre: String(x.nombre ?? ''),
        })) as ProvinciaDto[];
      }),
      tap((list) => {
        // orden seguro
        const sorted = [...list].sort((a, b) => a.idProvincia - b.idProvincia);
        this.provincias.set(sorted);
      }),
      catchError((err) => {
        console.error('[EditarPerfil] provincias error', err);
        this.provincias.set([]);
        return of([]);
      })
    );
  }

  onProvinciaChange(idProv: number | null): void {
    const f = this.form();
    if (!f) return;

    // set provincia
    f.idProvincia = idProv;
    // reset localidad
    f.idLocalidad = null;

    this.form.set({ ...f });
    this.localidades.set([]);

    if (idProv && idProv > 0) {
      this.loadLocalidadesByProvincia(idProv);
    }
  }

  private loadLocalidadesByProvincia(idProvincia: number): void {
    this.localidadesLoading.set(true);

    this.localidadApi.getAll({
      page: 1,
      pageSize: 100,
      idProvincia: Number(idProvincia),
    }).pipe(
      map((resp: any) => {
          const data = Array.isArray(resp?.data) ? resp.data : (Array.isArray(resp) ? resp : []);
          return (data as any[]).map(x => ({
          idLocalidad: Number(x.idLocalidad),
          nombre: String(x.nombre ?? ''),
          provincia: x.provincia,
        })) as LocalidadDto[];
      }),
      finalize(() => this.localidadesLoading.set(false)),
      catchError((err) => {
        console.error('[EditarPerfil] localidades error', err);
        this.localidadesLoading.set(false);
        this.localidades.set([]);
        return of([]);
      })
    ).subscribe((list) => {
      // orden seguro por nombre
      const sorted = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre));
      this.localidades.set(sorted);
    });
  }

  // Guardar
  onGuardar(): void {
    const f = this.form();
    const u = this.me();
    if (!f || !u || this.saving()) return;

    this.saving.set(true);
    this.errorMsg.set(null);
    this.okMsg.set(null);

    const dtoUser: UpdateUsuarioDto = {
      nombres: (f.nombres ?? '').trim() || null,
      apellidos: (f.apellidos ?? '').trim() || null,
      dniCuitCuil: (f.dniCuitCuil ?? '').trim() || null,
    };

    const rol = this.mapRol(u.idRolUsuario);

    const user$ = this.usuariosApi.updateMe(dtoUser).pipe(
      catchError((err) => {
        console.error('[EditarPerfil] PATCH /usuarios/me', err);
        throw err;
      })
    );

    const cli$ = (rol === 'CLIENTE')
      ? this.clienteApi.updateMe({
          razonSocial: (f.razonSocial ?? '').trim() || null,
          direccion: (f.direccion ?? '').trim() || null,
          idProvincia: f.idProvincia ?? null,
          idLocalidad: f.idLocalidad ?? null,
          idTipoCliente: f.idTipoCliente ?? null,
        } as UpdateClienteDto).pipe(
          catchError((err) => {
            console.error('[EditarPerfil] PATCH /clientes/me', err);
            throw err;
          })
        )
      : of(null);

    forkJoin({ user: user$, cli: cli$ }).pipe(
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: ({ user, cli }) => {
        this.me.set(user);
        if (cli) this.cliente.set(cli);

        this.buildForm(user, cli ?? this.cliente());
        this.okMsg.set('Perfil actualizado correctamente ✅');
      },
      error: (err) => {
        const msg = String(err?.error?.message ?? err?.message ?? '');
        this.errorMsg.set(msg ? `No se pudo guardar: ${msg}` : 'No se pudieron guardar los cambios.');
      },
    });
  }

  // Helpers

  private mapRol(idRolUsuario: number): Rol {
    if (Number(idRolUsuario) === 1) return 'ADMIN';
    if (Number(idRolUsuario) === 2) return 'OPERARIO';
    return 'CLIENTE';
  }

  tipoClienteLabel(idTipoCliente: number | null | undefined): string {
    const t = Number(idTipoCliente);
    if (t === 1) return 'CIUDADANO';
    if (t === 2) return 'PYME/EMPRESA';
    if (t === 3) return 'INSTITUCION';
    return '—';
  }

  formatInt(n: number): string {
    return new Intl.NumberFormat('es-AR').format(Math.round(Number(n) || 0));
  }
}