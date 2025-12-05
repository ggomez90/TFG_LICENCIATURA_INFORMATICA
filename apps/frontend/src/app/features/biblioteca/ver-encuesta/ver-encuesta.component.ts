import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { RolesService } from '../../../auth/roles.service';
import { EncuestaApi, EncuestaItem } from '../../../api/encuesta.api';

interface EncuestaDetalle {
  idEncuesta: number;
  idAdmin: number;
  titulo: string;
  descripcion: string;             // HTML +  JSON embebido para las opciones de la encuesta
  fechaPublicacion: string;        // ISO
  fechaCierre: string;             // ISO
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
  imports: [CommonModule, RouterModule],
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
  isAdmin = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly http: HttpClient,
    private readonly router: Router,
    private readonly roles: RolesService,
    private readonly sanitizer: DomSanitizer,
    private readonly cdr: ChangeDetectorRef,
    private readonly encuestaApi: EncuestaApi,
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']);

    const param = this.route.snapshot.paramMap.get('idEncuesta');
    this.id = Number(param);
    if (!this.id || Number.isNaN(this.id)) {
      this.errorMsg = 'Identificador de encuesta inválido.';
      return;
    }

    this.cargar();
  }

  get isMultiple(): boolean {
    return this._tipo === 'multiple';
  }

  private cargar(): void {
    this.loading = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    //GET /encuestas/:id
    this.encuestaApi.getPublicById(this.id).subscribe({
      next: (resp: EncuestaItem) => {
        const detalle: EncuestaDetalle = {
          idEncuesta: resp.idEncuesta!,
          idAdmin: resp.idAdmin!,
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

        this.verificarRespuestaPrevia();
      },
      error: (err) => {
        console.error('Error cargando encuesta', err);
        this.errorMsg = 'No se pudo cargar la encuesta.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  //opciones de encuesta
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

    return {
      plainHtml: html || '(Sin descripción)',
      tipo,
      opciones,
    };
  }

  private verificarRespuestaPrevia(): void {
    if (this.data && !this.data.activa) {
      this.locked = true;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    const params = new HttpParams()
      .set('idEncuesta', String(this.id))
      .set('limit', '1');

    this.http.get<any>(`/api/respuestas`, { params }).subscribe({
      next: (r) => {
        const items = Array.isArray(r?.items) ? r.items : [];
        if (items.length > 0) {
          this.locked = true;

          const contenido = String(items[0]?.contenido ?? '');
          try {
            const cj = JSON.parse(contenido);
            const ids: string[] = Array.isArray(cj?.ids) ? cj.ids : [];
            this.selectedIds = new Set(ids);
          } catch {
            const ids = contenido.split(',').map((s) => s.trim()).filter(Boolean);
            this.selectedIds = new Set(ids);
          }
        } else {
          this.locked = false;
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.locked = false;
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
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

  onSeleccionChange(checked: boolean | undefined, opcionId: string): void {
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

  onVolver(): void {
    if (this.isAdmin) {
      this.router.navigate(['/menu-principal/admin/biblioteca']);
    } else {
      this.router.navigate(['/menu-principal/cliente/biblioteca']);
    }
  }

  onEnviarRespuesta(): void {
    alert('(Demo) Aquí enviaremos la respuesta al backend en el siguiente paso.');
  }
}
