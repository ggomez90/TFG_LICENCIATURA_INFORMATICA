// Yo_Reciclo\apps\frontend\src\app\features\perfil\mis-datos.component.ts
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';

import { UsuariosApi, UsuarioDto } from '../../api/usuarios.api';
import { ClienteDto } from '../../api/cliente.api';
import { ProvinciaApi } from '../../api/provincia.api';
import { LocalidadApi } from '../../api/localidad.api';
import { apiUrl } from '../../api/api.config';

type Rol = 'ADMIN' | 'OPERARIO' | 'CLIENTE';

type UsuarioPerfilVM = {
  idUsuario: number;
  nombres?: string | null;
  apellidos?: string | null;
  dniCuitCuil?: string | null;
  direccion?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  usuario?: string | null;
  email?: string | null;
  rol: Rol;
  estado: boolean;
  puntos: number;

  // cliente extra
  razonSocial?: string | null;
  idTipoCliente?: number | null;

  // ids raw
  idProvincia?: number | null;
  idLocalidad?: number | null;
};

@Component({
  selector: 'app-mis-datos',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf],
  templateUrl: './mis-datos.component.html',
  styleUrls: ['./mis-datos.component.scss'],
})
export class MisDatosComponent {
  private usuariosApi = inject(UsuariosApi);
  private http = inject(HttpClient);
  private provinciaApi = inject(ProvinciaApi);
  private localidadApi = inject(LocalidadApi);

  loading = signal(false);
  errorMsg = signal<string | null>(null);

  // data principal
  me = signal<UsuarioDto | null>(null);
  cliente = signal<ClienteDto | null>(null);

  // nombres resueltos
  provinciaNombre = signal<string | null>(null);
  localidadNombre = signal<string | null>(null);

  // view model listo para pintar
  usuario = computed<UsuarioPerfilVM | null>(() => {
    const u = this.me();
    if (!u) return null;

    const rol: Rol = this.mapRol(u.idRolUsuario);
    const estado = Number(u.idEstadoUsuario) === 2; // 2=HABILITADO (según tu comentario)

    const cli = this.cliente();

    // prioridad: si viene cliente -> usar sus campos (direccion/ids/puntos/razonSocial)
    const direccion = (cli?.direccion ?? u.cliente?.direccion ?? null);
    const idProvincia = (cli?.idProvincia ?? u.cliente?.idProvincia ?? null);
    const idLocalidad = (cli?.idLocalidad ?? u.cliente?.idLocalidad ?? null);

    const puntos = Number(
      cli?.puntos ??
        u.cliente?.puntos ??
        0
    );

    const provNombre = this.provinciaNombre();
    const locNombre = this.localidadNombre();

    return {
      idUsuario: Number(u.idUsuario),
      nombres: u.nombres ?? null,
      apellidos: u.apellidos ?? null,
      razonSocial: cli?.razonSocial ?? u.cliente?.razonSocial ?? null,
      dniCuitCuil: u.dniCuitCuil ?? null,
      direccion: direccion ?? null,
      provincia: provNombre ?? (idProvincia ? `#${idProvincia}` : null),
      localidad: locNombre ?? (idLocalidad ? `#${idLocalidad}` : null),
      usuario: u.usuario ?? null,
      email: u.email ?? null,
      rol,
      estado,
      puntos,

      idTipoCliente: cli?.idTipoCliente ?? u.cliente?.idTipoCliente ?? null,
      idProvincia: (idProvincia ?? null) as any,
      idLocalidad: (idLocalidad ?? null) as any,
    };
  });

  // init
  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    if (this.loading()) return;

    this.loading.set(true);
    this.errorMsg.set(null);
    this.me.set(null);
    this.cliente.set(null);
    this.provinciaNombre.set(null);
    this.localidadNombre.set(null);

    this.usuariosApi
      .me()
      .pipe(
        catchError((err) => {
          console.error('[MisDatos] /usuarios/me error', err);
          this.errorMsg.set('No se pudieron cargar tus datos de usuario.');
          return of(null);
        }),
        finalize(() => this.loading.set(false))
      )
      .subscribe((u) => {
        if (!u) return;

        this.me.set(u);

        const rol = this.mapRol(u.idRolUsuario);

        if (rol === 'CLIENTE') {
          // ✅ PERFIL PROPIO: usar /clientes/me (evita 403 de /clientes/:id)
          this.loadClienteMe();
        } else {
          // si no es cliente, igual podemos intentar resolver provincia/localidad si viene embebido
          const idProv = Number(u?.cliente?.idProvincia ?? 0);
          const idLoc = Number(u?.cliente?.idLocalidad ?? 0);
          this.resolveUbicacion(idProv, idLoc);
        }
      });
  }

  private loadClienteMe(): void {
    this.http
      .get<ClienteDto>(apiUrl('/clientes/me'))
      .pipe(
        catchError((err) => {
          console.error('[MisDatos] /clientes/me error', err);
          // Dejamos el usuario visible pero avisamos
          this.errorMsg.set('No se pudieron cargar los datos del cliente.');
          return of(null);
        })
      )
      .subscribe((cli) => {
        if (!cli) return;

        this.cliente.set(cli);

        const idProv = Number(cli.idProvincia ?? 0);
        const idLoc = Number(cli.idLocalidad ?? 0);
        this.resolveUbicacion(idProv, idLoc);
      });
  }

  private resolveUbicacion(idProv: number, idLoc: number): void {
    const prov$ =
      Number.isFinite(idProv) && idProv > 0
        ? this.provinciaApi.getById(idProv).pipe(
            map((p: any) => String(p?.nombre ?? '').trim() || null),
            catchError(() => of(null))
          )
        : of(null);

    const loc$ =
      Number.isFinite(idLoc) && idLoc > 0
        ? this.localidadApi.getById(idLoc).pipe(
            map((l: any) => String(l?.nombre ?? '').trim() || null),
            catchError(() => of(null))
          )
        : of(null);

    forkJoin({ prov: prov$, loc: loc$ }).subscribe(({ prov, loc }) => {
      this.provinciaNombre.set(prov);
      this.localidadNombre.set(loc);
    });
  }

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

  // helper de formato (por si lo usás en el html)
  formatInt(n: number): string {
    return new Intl.NumberFormat('es-AR').format(Math.round(Number(n) || 0));
  }
}
