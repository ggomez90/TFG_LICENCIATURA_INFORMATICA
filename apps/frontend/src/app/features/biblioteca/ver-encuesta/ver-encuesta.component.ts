import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { RolesService } from '../../../auth/roles.service';
import { EncuestaApi, EncuestaItem } from '../../../api/encuesta.api';
import { RespuestaApi } from '../../../api/respuesta.api';
import { FooterInvitadoComponent } from '../roles/invitado/footer-invitado.component';

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
  imports: [CommonModule, RouterModule, FormsModule, FooterInvitadoComponent],
  templateUrl: './ver-encuesta.component.html',
  styleUrls: ['./ver-encuesta.component.scss'],
})
export class VerEncuestaComponent implements OnInit {
  id!: number;

  loading = false;
  submitting = false;
  errorMsg: string | null = null;

  data: EncuestaDetalle | null = null;

  tituloHtml: SafeHtml | null = null;
  descripcionHtml: SafeHtml | null = null;

  opciones: OpcionUI[] = [];
  private _tipo: TipoSeleccion = 'single';
  selectedIds = new Set<string>();

  locked = false;
  closedByDate = false;

  isAdmin = false;
  isCliente = false;
  isGuest = false;

  guestNombre = '';
  guestApellido = '';
  guestDni = '';
  guestVerified = false;
  guestAlreadyResponded = false;
  guestMustLogin = false;

  showGuestModal = false;
  guestModalError = '';
  guestModalInfo = '';

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
    this.isGuest = !this.isAdmin && !this.isCliente && this.router.url.startsWith('/invitado');

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
    if (this.closedByDate) return false;
    if (!this.data?.activa) return false;
    if (this.locked) return false;
    return true;
  }

  get canSend(): boolean {
    if (this.isAdmin) return false;
    if (!this.canInteractOptions) return false;
    if (this.selectedIds.size === 0) return false;
    return true;
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

        this.closedByDate = this.isClosedByDate(detalle.fechaCierre);

        if (!detalle.activa || this.closedByDate) {
          this.locked = true;
          this.loading = false;
          this.cdr.markForCheck();
          return;
        }

        if (this.isCliente) {
          this.verificarRespuestaPreviaCliente();
        } else {
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

  openGuestModal(): void {
    if (!this.isGuest || !this.canSend) return;
    this.guestModalError = '';
    this.guestModalInfo = '';
    this.showGuestModal = true;
    this.cdr.markForCheck();
  }

  closeGuestModal(): void {
    this.showGuestModal = false;
    this.guestModalError = '';
    this.guestModalInfo = '';
    this.cdr.markForCheck();
  }

  onVerificarDniInvitado(): void {
    if (!this.isGuest) return;
    if (this.closedByDate || !this.data?.activa) return;

    const dni = this.normalizeDni(this.guestDni);
    if (!dni) {
      this.guestVerified = false;
      this.guestMustLogin = false;
      this.guestAlreadyResponded = false;
      this.guestModalError = 'Ingresá un DNI válido para continuar.';
      this.guestModalInfo = '';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.guestModalError = '';
    this.guestModalInfo = '';
    this.guestVerified = false;
    this.guestMustLogin = false;
    this.guestAlreadyResponded = false;
    this.cdr.markForCheck();

    this.respuestaApi.validatePublic(this.id, dni).subscribe({
      next: (resp) => {
        this.guestVerified = true;

        if (resp?.mustLogin) {
          this.guestMustLogin = true;
          this.guestAlreadyResponded = false;
          this.locked = false;
          this.guestModalError = 'Este DNI pertenece a un usuario registrado. Debes iniciar sesión.';
        } else if (resp?.responded && resp?.item) {
          this.guestAlreadyResponded = true;
          this.guestMustLogin = false;
          this.locked = true;
          this.applyContenidoToSelectedIds(String(resp.item.contenido ?? ''));
          this.guestModalInfo = 'Ya existe una respuesta registrada con este DNI.';
        } else {
          this.guestAlreadyResponded = false;
          this.guestMustLogin = false;
          this.locked = false;
          this.guestModalInfo = 'DNI validado correctamente. Ya podés enviar la respuesta.';
        }

        this.submitting = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error validando DNI invitado', err);
        this.guestModalError = err?.error?.message ?? 'No se pudo verificar el DNI. Intentá nuevamente.';
        this.guestModalInfo = '';
        this.submitting = false;
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

  onEnviarRespuesta(): void {
    if (!this.data) return;
    if (!this.canSend) return;

    if (!this.data.activa || this.closedByDate) {
      this.errorMsg = 'La encuesta está cerrada y no admite respuestas.';
      this.cdr.markForCheck();
      return;
    }

    if (this.isGuest) {
      this.openGuestModal();
      return;
    }

    this.enviarRespuestaCliente();
  }

  enviarRespuestaCliente(): void {
    const ids = Array.from(this.selectedIds);
    const payloadContenido = JSON.stringify({ ids });

    const dtoBase = {
      idEncuesta: this.id,
      fechaRespuesta: new Date().toISOString(),
      contenido: payloadContenido,
    };

    this.submitting = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.respuestaApi.createMine(dtoBase).subscribe({
      next: () => {
        this.locked = true;
        this.submitting = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error enviando respuesta (cliente)', err);
        this.errorMsg = err?.error?.message ?? 'No se pudo enviar la respuesta.';
        this.submitting = false;
        this.cdr.markForCheck();
      },
    });
  }

  confirmarEnvioInvitado(): void {
    if (!this.isGuest) return;

    const dni = this.normalizeDni(this.guestDni);
    const nombre = this.guestNombre.trim();
    const apellido = this.guestApellido.trim();

    if (!nombre || !apellido || !dni) {
      this.guestModalError = 'Completá nombre, apellido y DNI.';
      this.cdr.markForCheck();
      return;
    }

    if (!this.guestVerified || this.guestMustLogin || this.guestAlreadyResponded) {
      this.guestModalError = 'Primero debés verificar un DNI válido antes de enviar.';
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

    const datosInvitado = `${nombre} ${apellido}`.trim();

    this.submitting = true;
    this.guestModalError = '';
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.respuestaApi
      .createPublic({
        ...dtoBase,
        datosInvitado,
        dniCuilCuitInvitado: dni,
      })
      .subscribe({
        next: () => {
          this.locked = true;
          this.submitting = false;
          this.showGuestModal = false;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error enviando respuesta (invitado)', err);
          this.guestModalError = err?.error?.message ?? 'No se pudo enviar la respuesta.';
          this.submitting = false;
          this.cdr.markForCheck();
        },
      });
  }

  onVolver(): void {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    if (this.isGuest) {
      this.router.navigate(['/invitado/biblioteca']);
      return;
    }

    if (this.isAdmin) {
      this.router.navigate(['/menu-principal/admin/biblioteca']);
    } else if (this.isCliente) {
      this.router.navigate(['/menu-principal/cliente/biblioteca']);
    } else {
      this.router.navigate(['/']);
    }
  }
}