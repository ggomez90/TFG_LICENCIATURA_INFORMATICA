import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { RolesService } from '../../../auth/roles.service';
import { EncuestaApi, EncuestaItem } from '../../../api/encuesta.api';
import { RespuestaApi } from '../../../api/respuesta.api';

interface EncuestaDetalle {
  idEncuesta: number;
  idAdmin?: number;
  titulo: string;
  descripcion: string;
  fechaPublicacion: string;
  fechaCierre: string;
  activa: boolean;
}

type TipoSeleccion = 'single' | 'multiple';

interface OpcionUI {
  id: string;
  texto: string;
  detalle?: string;
}

@Component({
  selector: 'app-ver-encuesta',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './ver-encuesta.component.html',
  styleUrls: ['./ver-encuesta.component.scss'],
})
export class VerEncuestaComponent implements OnInit {
  id!: number;

  loading = false;
  errorMsg: string | null = null;

  data: EncuestaDetalle | null = null;

  tituloHtml: SafeHtml | null = null;
  descripcionHtml: SafeHtml | null = null;

  opciones: OpcionUI[] = [];
  private _tipo: TipoSeleccion = 'single';
  selectedIds = new Set<string>();

  locked = false;

  // cierre por fecha
  closedByDate = false;

  // roles
  isAdmin = false;
  isCliente = false;

  // invitado
  isGuest = false;
  guestNombre = '';
  guestApellido = '';
  guestDni = '';
  guestVerified = false;
  guestAlreadyResponded = false;
  guestMustLogin = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly roles: RolesService,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef,
    private readonly encuestaApi: EncuestaApi,
    private readonly respuestaApi: RespuestaApi,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']);
    this.isCliente = this.roles.hasRole('CLIENTE');
    this.isGuest = !this.isAdmin && !this.isCliente;

    const param = this.route.snapshot.paramMap.get('idEncuesta');
    this.id = Number(param);
    if (!this.id || Number.isNaN(this.id)) {
      this.errorMsg = 'Identificador de encuesta inválido.';
      return;
    }

    this.cargarEncuesta();
  }

  get isMultiple(): boolean {
    return this._tipo === 'multiple';
  }

  get canInteractOptions(): boolean {
    if (this.isAdmin) return false;

    // si está vencida por fecha o inactiva o locked, no interactúa
    if (this.closedByDate) return false;
    if (!this.data?.activa) return false;
    if (this.locked) return false;

    if (this.isCliente) return true;

    // invitado
    return this.guestVerified && !this.guestMustLogin;
  }

  get canSend(): boolean {
    if (!this.canInteractOptions) return false;
    if (this.selectedIds.size === 0) return false;

    if (this.isCliente) return true;

    // invitado: requiere nombre+apellido+dni
    return (
      this.guestVerified &&
      !this.guestMustLogin &&
      this.guestNombre.trim().length > 0 &&
      this.guestApellido.trim().length > 0 &&
      this.normalizeDni(this.guestDni).length > 0
    );
  }

  private cargarEncuesta(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.encuestaApi.getPublicById(this.id).subscribe({
      next: (resp: EncuestaItem) => {
        const detalle: EncuestaDetalle = {
          idEncuesta: resp.idEncuesta!,
          idAdmin: (resp as any).idAdmin,
          titulo: (resp.titulo ?? '') as string,
          descripcion: (resp.descripcion ?? '') as string,
          fechaPublicacion: (resp.fechaPublicacion ?? '') as string,
          fechaCierre: (resp.fechaCierre ?? '') as string,
          activa: !!resp.activa,
        };

        this.data = detalle;
        this.tituloHtml = this.sanitizer.bypassSecurityTrustHtml(detalle.titulo || '(Sin título)');

        const parsed = this.parseDescripcion(detalle.descripcion || '');
        this.descripcionHtml = this.sanitizer.bypassSecurityTrustHtml(parsed.plainHtml);
        this._tipo = parsed.tipo;
        this.opciones = parsed.opciones;

        // --- cierre por fecha ---
        this.closedByDate = this.isClosedByDate(detalle.fechaCierre);

        // Si no está activa > lock
        if (!detalle.activa) {
          this.locked = true;
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        // Si venció por fecha > lock (pero se muestra)
        if (this.closedByDate) {
          this.locked = true;
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        // Verificación “ya respondí”
        if (this.isCliente) {
          this.verificarRespuestaPreviaCliente();
        } else {
          // Invitado: NO se verifica hasta que ingrese DNI
          this.loading = false;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error('Error cargando encuesta', err);
        this.errorMsg = 'No se pudo cargar la encuesta.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private isClosedByDate(fechaCierreIso?: string | null): boolean {
    if (!fechaCierreIso) return false;
    const cierre = new Date(fechaCierreIso).getTime();
    if (Number.isNaN(cierre)) return false;
    return cierre < Date.now();
  }

  //parse opciones
  private parseDescripcion(raw: string): { plainHtml: string; tipo: TipoSeleccion; opciones: OpcionUI[] } {
    let html = raw || '';
    let jsonStr: string | null = null;

    const reNew = /<!--\s*ENCUESTA_JSON([\s\S]*?)-->/i;
    const mNew = html.match(reNew);
    if (mNew) {
      jsonStr = (mNew[1] || '').trim();
      html = html.replace(reNew, '').trim();
    } else {
      const reSE = /<!--\s*ENCUESTA_JSON_START\s*-->([\s\S]*?)<!--\s*ENCUESTA_JSON_END\s*-->/i;
      const mSE = html.match(reSE);
      if (mSE) {
        jsonStr = (mSE[1] || '').trim();
        html = html.replace(reSE, '').trim();
      } else {
        const first = html.indexOf('{');
        const last = html.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          const tail = html.slice(first, last + 1).trim();
          if (tail.includes('"opciones"') || tail.includes('"tipoSeleccion"')) {
            try {
              JSON.parse(tail);
              jsonStr = tail;
              html = html.slice(0, first).trim();
            } catch {}
          }
        }
      }
    }

    let tipo: TipoSeleccion = 'single';
    let opciones: OpcionUI[] = [];

    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        tipo = parsed?.tipoSeleccion === 'multiple' ? 'multiple' : 'single';
        const arr = Array.isArray(parsed?.opciones) ? parsed.opciones : [];
        opciones = arr
          .filter((o: any) => o && typeof o.id === 'string' && typeof o.texto === 'string')
          .map((o: any) => ({ id: o.id, texto: o.texto, detalle: o.detalle }));
      } catch {}
    }

    return { plainHtml: html || '(Sin descripción)', tipo, opciones };
  }

  //helpers
  fmtFecha(iso?: string): string {
    if (!iso) return '-';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  isChecked(id: string): boolean {
    return this.selectedIds.has(id);
  }

  private normalizeDni(input: string): string {
    return String(input ?? '').replace(/\D+/g, '').trim();
  }

  //selección
  onSeleccionChange(checked: boolean | undefined, opcionId: string): void {
    if (!this.canInteractOptions) return;

    const isChecked = !!checked;
    if (this.isMultiple) {
      if (isChecked) this.selectedIds.add(opcionId);
      else this.selectedIds.delete(opcionId);
    } else {
      this.selectedIds.clear();
      if (isChecked) this.selectedIds.add(opcionId);
    }
    this.cdr.markForCheck();
  }

  //verificación respuesta previa (cliente logueado)
  private verificarRespuestaPreviaCliente(): void {
    this.respuestaApi.getMine(this.id).subscribe({
      next: (resp) => {
        if (resp) {
          this.locked = true;
          this.applyContenidoToSelectedIds(String(resp.contenido ?? ''));
        } else {
          this.locked = false;
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.warn('No se pudo verificar respuesta previa (cliente)', err);
        this.locked = false;
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  //verificación invitado (por DNI)
  onVerificarDniInvitado(): void {
    if (this.isCliente || this.isAdmin) return;
    if (this.closedByDate || !this.data?.activa) return;

    const dni = this.normalizeDni(this.guestDni);
    if (!dni) {
      this.guestVerified = false;
      this.guestMustLogin = false;
      this.guestAlreadyResponded = false;
      this.errorMsg = 'Ingresá un DNI válido para continuar.';
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.errorMsg = null;
    this.guestVerified = false;
    this.guestMustLogin = false;
    this.guestAlreadyResponded = false;
    this.cdr.markForCheck();

    this.respuestaApi.checkPublic(this.id, dni).subscribe({
      next: (resp) => {
        this.guestVerified = true;

        if (resp?.responded && resp?.item) {
          this.guestAlreadyResponded = true;
          this.locked = true;
          this.applyContenidoToSelectedIds(String(resp.item.contenido ?? ''));
        } else {
          this.locked = false;
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        const msg = err?.error?.message;
        if (typeof msg === 'string' && msg.toLowerCase().includes('inicie sesión')) {
          this.guestMustLogin = true;
          this.guestVerified = true;
        } else {
          this.errorMsg = 'No se pudo verificar el DNI. Intentá nuevamente.';
        }

        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private applyContenidoToSelectedIds(contenido: string): void {
    try {
      const cj = JSON.parse(contenido);
      const ids: string[] = Array.isArray(cj?.ids) ? cj.ids : [];
      this.selectedIds = new Set(ids);
      return;
    } catch {}

    const ids = String(contenido)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    this.selectedIds = new Set(ids);
  }

  //enviar respuesta
  onEnviarRespuesta(): void {
    if (!this.data) return;
    if (!this.canSend) return;

    // bloqueo duro en front
    if (!this.data.activa || this.closedByDate) {
      this.errorMsg = 'La encuesta está cerrada y no admite respuestas.';
      this.cdr.markForCheck();
      return;
    }

    const ids = Array.from(this.selectedIds);
    const payloadContenido = JSON.stringify({ ids });

    const dtoBase = {
      idEncuesta: this.id,
      fechaRespuesta: new Date().toISOString(),
      contenido: payloadContenido,
    };

    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    // Cliente logueado
    if (this.isCliente) {
      this.respuestaApi.createMine(dtoBase).subscribe({
        next: () => {
          this.locked = true;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error enviando respuesta (cliente)', err);
          this.errorMsg = err?.error?.message ?? 'No se pudo enviar la respuesta.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
      return;
    }

    // Invitado
    const dni = this.normalizeDni(this.guestDni);
    const datosInvitado = `${this.guestNombre.trim()} ${this.guestApellido.trim()}`.trim();

    this.respuestaApi
      .createPublic({
        ...dtoBase,
        datosInvitado,
        dniCuilCuitInvitado: dni,
      })
      .subscribe({
        next: () => {
          this.locked = true;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error enviando respuesta (invitado)', err);
          this.errorMsg = err?.error?.message ?? 'No se pudo enviar la respuesta.';
          this.loading = false;
          this.cdr.markForCheck();
        },
      });
  }

  // navegación
  onVolver(): void {
    if (this.isAdmin) {
      this.router.navigate(['/menu-principal/admin/biblioteca']);
    } else if (this.isCliente) {
      this.router.navigate(['/menu-principal/cliente/biblioteca']);
    } else {
      this.router.navigate(['/']);
    }
  }
}