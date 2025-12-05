import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RolesService } from '../../../../../auth/roles.service';
import { EncuestaApi } from '../../../../../api/encuesta.api';

type TipoSeleccion = 'single' | 'multiple';

interface OpcionEncuesta {
  id: string;
  texto: string;
  detalle?: string;
}

interface EncuestaForm {
  titulo: string;               // HTML desde editor
  descripcion: string;          // HTML sin el bloque JSON (solo la consigna)
  fechaPublicacion: string;     // 'YYYY-MM-DD' (solo display, no editable)
  fechaCierre: string;          // 'YYYY-MM-DD' (editable)
  activa: boolean;
  opciones: OpcionEncuesta[];   // opciones embebidas
  tipoSeleccion: TipoSeleccion; // single | multiple
}

@Component({
  selector: 'app-editar-encuesta',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './editar-encuesta.component.html',
  styleUrls: ['./editar-encuesta.component.scss'],
})
export class EditarEncuestaComponent implements OnInit, AfterViewInit {
  id!: number;
  loading = false;
  saving = false;
  errorMsg: string | null = null;
  isAdmin = false;

  @ViewChild('tituloEditor') tituloEditor?: ElementRef<HTMLDivElement>;
  @ViewChild('descripcionEditor') descripcionEditor?: ElementRef<HTMLDivElement>;

  form: EncuestaForm = {
    titulo: '',
    descripcion: '',
    fechaPublicacion: '',
    fechaCierre: '',
    activa: false,
    opciones: [],
    tipoSeleccion: 'single',
  };

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly roles: RolesService,
    private readonly cdr: ChangeDetectorRef,
    private readonly encuestaApi: EncuestaApi,
  ) {}

  // Ciclo de vida
  ngOnInit(): void {
    this.isAdmin = this.roles.hasAnyRole(['ADMIN', 'ADMINISTRADOR']);
    const paramId = this.route.snapshot.paramMap.get('idEncuesta');
    this.id = Number(paramId);
    if (!this.id || Number.isNaN(this.id)) {
      this.errorMsg = 'Identificador de encuesta inválido.';
      return;
    }
    this.cargar();
  }

  ngAfterViewInit(): void {
    // Se cargan los editores luego de cargar() con detectChanges()
  }

  //Utilitarios
  private toDateOnly(iso: string): string {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('div');
    tmp.innerHTML = html || '';
    return (tmp.textContent || tmp.innerText || '').trim();
  }

  private genId(): string {
    try {
      // @ts-ignore
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // @ts-ignore
        return crypto.randomUUID();
      }
    } catch {}
    return `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  getMinFechaCierre(): string | null {
    return this.form.fechaPublicacion || null;
  }

  //Navegación
  onVolver(): void {
    this.router.navigate(['/menu-principal/admin/biblioteca']);
  }

  //Carga inicial
  private cargar(): void {
    this.loading = true;
    this.errorMsg = null;

    this.encuestaApi.getPublicById(this.id).subscribe({
      next: (resp) => {
        const { consignaHtml, opciones, tipoSeleccion } = this.parseDescripcion(resp.descripcion ?? '');

        this.form = {
          titulo: (resp.titulo ?? ''),
          descripcion: consignaHtml,
          fechaPublicacion: this.toDateOnly((resp.fechaPublicacion ?? '') as string),
          fechaCierre: this.toDateOnly((resp.fechaCierre ?? '') as string),
          activa: !!resp.activa,
          opciones,
          tipoSeleccion,
        };

        this.loading = false;
        this.cdr.detectChanges();

        if (this.tituloEditor) {
          this.tituloEditor.nativeElement.innerHTML = this.form.titulo || '';
          if (!this.tituloEditor.nativeElement.getAttribute('dir')) {
            this.tituloEditor.nativeElement.setAttribute('dir', 'ltr');
          }
        }
        if (this.descripcionEditor) {
          this.descripcionEditor.nativeElement.innerHTML = this.form.descripcion || '';
          if (!this.descripcionEditor.nativeElement.getAttribute('dir')) {
            this.descripcionEditor.nativeElement.setAttribute('dir', 'ltr');
          }
        }

        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('No se pudo cargar la encuesta', err);
        this.errorMsg = 'No se pudo cargar la encuesta seleccionada.';
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }

  //Extraccion de bloque JSON embebido en la descripcion, devuelve
  //consignaHtml: la parte de HTML sin el JSON y  opciones + tipoSeleccion (si existen)
  private parseDescripcion(descripcion: string | null | undefined): {
    consignaHtml: string;
    opciones: OpcionEncuesta[];
    tipoSeleccion: TipoSeleccion;
  } {
    let consigna = descripcion || '';
    let opciones: OpcionEncuesta[] = [];
    let tipoSeleccion: TipoSeleccion = 'single';

    if (!descripcion) {
      return { consignaHtml: consigna, opciones, tipoSeleccion };
    }

    // Formato single-tag: ENCUESTA_JSON{...}
    const singleTagRe = /<!--\s*ENCUESTA_JSON\s*(\{[\s\S]*?\})\s*-->/i;
    const singleMatch = descripcion.match(singleTagRe);
    if (singleMatch && singleMatch[1]) {
      const jsonText = singleMatch[1];
      consigna = descripcion.replace(singleTagRe, '').trim();
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed?.tipoSeleccion === 'multiple') tipoSeleccion = 'multiple';
        if (Array.isArray(parsed?.opciones)) {
          opciones = parsed.opciones
            .filter((o: any) => o && typeof o.id === 'string' && typeof o.texto === 'string')
            .map((o: any) => ({ id: o.id, texto: o.texto, detalle: o.detalle }));
        }
      } catch {}
      return { consignaHtml: consigna, opciones, tipoSeleccion };
    }

    // Formato START/END
    const start = '<!--ENCUESTA_JSON_START-->';
    const end = '<!--ENCUESTA_JSON_END-->';
    const sIdx = descripcion.indexOf(start);
    const eIdx = descripcion.indexOf(end);
    if (sIdx !== -1 && eIdx !== -1 && eIdx > sIdx) {
      const jsonText = descripcion.substring(sIdx + start.length, eIdx).trim();
      consigna = (descripcion.substring(0, sIdx) + descripcion.substring(eIdx + end.length)).trim();
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed?.tipoSeleccion === 'multiple') tipoSeleccion = 'multiple';
        if (Array.isArray(parsed?.opciones)) {
          opciones = parsed.opciones
            .filter((o: any) => o && typeof o.id === 'string' && typeof o.texto === 'string')
            .map((o: any) => ({ id: o.id, texto: o.texto, detalle: o.detalle }));
        }
      } catch {}
      return { consignaHtml: consigna, opciones, tipoSeleccion };
    }

    // Fallback JSON suelto
    const braceStart = descripcion.lastIndexOf('{');
    const braceEnd = descripcion.lastIndexOf('}');
    if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
      const candidate = descripcion.substring(braceStart, braceEnd + 1);
      if (candidate.includes('"__meta"') && candidate.includes('encuesta:v1')) {
        try {
          const parsed = JSON.parse(candidate);
          if (parsed?.tipoSeleccion === 'multiple') tipoSeleccion = 'multiple';
          if (Array.isArray(parsed?.opciones)) {
            opciones = parsed.opciones
              .filter((o: any) => o && typeof o.id === 'string' && typeof o.texto === 'string')
              .map((o: any) => ({ id: o.id, texto: o.texto, detalle: o.detalle }));
          }
          consigna = (descripcion.substring(0, braceStart) + descripcion.substring(braceEnd + 1)).trim();
        } catch {}
      }
    }

    consigna = consigna
      .replace(/<!--\s*ENCUESTA_JSON_START\s*-->/gi, '')
      .replace(/<!--\s*ENCUESTA_JSON_END\s*-->/gi, '')
      .replace(/<!--\s*ENCUESTA_JSON\s*-->/gi, '')
      .trim();

    return { consignaHtml: consigna, opciones, tipoSeleccion };
  }

  //se reconstruye la descripcion final igual que en crear encuesta con un comentario de tipo <!--ENCUESTA_JSON{...}-->
  private buildDescripcionPayload(
    consignaHtml: string,
    opciones: OpcionEncuesta[],
    tipo: TipoSeleccion
  ): string {
    // limpia cualquier formato previo
    let clean = (consignaHtml || '')
      .replace(/<!--\s*ENCUESTA_JSON\s*\{[\s\S]*?\}\s*-->/gi, '')
      .replace(/<!--\s*ENCUESTA_JSON_START\s*-->\s*\{[\s\S]*?\}\s*<!--\s*ENCUESTA_JSON_END\s*-->/gi, '')
      .trim();

    // por si queda JSON suelto al final
    clean = clean.replace(/\{[\s\S]*?"__meta"\s*:\s*"encuesta:v1"[\s\S]*?\}\s*$/i, '').trim();

    // arma el JSON embebido
    const json = {
      __meta: 'encuesta:v1',
      tipoSeleccion: tipo === 'multiple' ? 'multiple' : 'single',
      opciones: (opciones || []).map(o => ({
        id: o.id,
        texto: o.texto,
        detalle: o.detalle
      })),
    };

    // devuelve consigna + comentario
    return `${clean}\n<!--ENCUESTA_JSON${JSON.stringify(json)}-->`;
  }


  // Toolbar / WYSIWYG
  setActiveEditor(_editor: 'titulo' | 'descripcion') {}
  format(cmd: string) { document.execCommand(cmd, false); }
  private formatWithValue(cmd: string, value: string) { document.execCommand(cmd, false, value); }
  onFontFamilyChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (!value) return;
    this.formatWithValue('fontName', value);
  }
  onFontSizeChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    if (!value) return;
    this.formatWithValue('fontSize', value);
  }
  currentColor = '#0b3b25';
  onColorChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.currentColor = value;
    this.formatWithValue('foreColor', value);
  }
  clearFormat() {
    document.execCommand('removeFormat', false);
    document.execCommand('unlink', false);
  }

  onTituloInput(e: Event) {
    const el = (e.target as HTMLElement);
    this.form.titulo = el.innerHTML || '';
  }

  onDescripcionInput(e: Event) {
    const el = (e.target as HTMLElement);
    this.form.descripcion = el.innerHTML || '';
  }

  onTituloChange(event: Event) {
    const el = event.target as HTMLElement;
    if (el.getAttribute('dir') !== 'ltr') el.setAttribute('dir', 'ltr');
    const max = 300;
    const plain = (el.innerText || '');
    if (plain.length > max) {  }
    this.form.titulo = el.innerHTML || '';
  }

  onDescripcionChange(event: Event) {
    const el = event.target as HTMLElement;
    if (el.getAttribute('dir') !== 'ltr') el.setAttribute('dir', 'ltr');
    const max = 5000;
    const plain = (el.innerText || '');
    if (plain.length > max) { }
    this.form.descripcion = el.innerHTML || '';
  }

  // Opciones
  addOpcion(): void {
    const texto = prompt('Texto de la opción:');
    if (!texto) return;
    this.form.opciones.push({ id: this.genId(), texto });
  }

  removeOpcion(id: string): void {
    this.form.opciones = this.form.opciones.filter(o => o.id !== id);
  }

  toggleTipoSeleccion(): void {
    this.form.tipoSeleccion = this.form.tipoSeleccion === 'single' ? 'multiple' : 'single';
  }

  // Guardado
  onGuardar(): void {
    if (!this.validar()) return;

    if (this.tituloEditor) this.form.titulo = this.tituloEditor.nativeElement.innerHTML || '';
    if (this.descripcionEditor) this.form.descripcion = this.descripcionEditor.nativeElement.innerHTML || '';

    const descripcionPayload = this.buildDescripcionPayload(
      this.form.descripcion || '',
      this.form.opciones || [],
      this.form.tipoSeleccion || 'single',
    );

    const payload: any = {
      titulo: (this.form.titulo || '').trim(),
      descripcion: descripcionPayload.trim(),
      fechaCierre: new Date(`${this.form.fechaCierre}T00:00:00`).toISOString(),
      activa: this.form.activa,
    };

    this.saving = true;
    this.encuestaApi.update(this.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/menu-principal/admin/biblioteca']);
      },
      error: (err) => {
        console.error('Error al guardar encuesta', err);
        this.saving = false;
        alert('Ocurrió un error al guardar la encuesta. Intentá nuevamente.');
        this.cdr.markForCheck();
      },
    });
  }

  private validar(): boolean {
    if (!this.form.titulo || !this.stripHtml(this.form.titulo).trim()) {
      alert('El título es obligatorio.');
      return false;
    }
    if (!this.form.descripcion || !this.stripHtml(this.form.descripcion).trim()) {
      alert('La descripción es obligatoria.');
      return false;
    }
    if (!this.form.fechaCierre) {
      alert('La fecha de cierre es obligatoria.');
      return false;
    }
    if (this.form.fechaPublicacion && this.form.fechaCierre < this.form.fechaPublicacion) {
      alert('La fecha de cierre debe ser igual o posterior a la de publicación.');
      return false;
    }
    return true;
  }
}
