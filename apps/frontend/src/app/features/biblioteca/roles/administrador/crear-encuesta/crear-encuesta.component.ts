import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { EncuestaApi } from '../../../../../api/encuesta.api';

interface OpcionEncuesta {
  id: string;
  texto: string;
  detalle?: string;
}

interface EncuestaForm {
  titulo: string;
  descripcion: string;        // hasta 5000
  fechaPublicacion: string;   // yyyy-MM-dd
  fechaCierre: string;        // yyyy-MM-dd
  activa: boolean;

  // Opciones de borrador local sin persistencia
  opciones: OpcionEncuesta[];
  tipoSeleccion: 'single' | 'multiple';
}

@Component({
  selector: 'app-crear-encuesta',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './crear-encuesta.component.html',
  styleUrls: ['./crear-encuesta.component.scss'],
})
export class CrearEncuestaComponent implements OnInit, AfterViewInit {
  @ViewChild('tituloEditor') tituloEditor?: ElementRef<HTMLDivElement>;
  @ViewChild('descripcionEditor') descripcionEditor?: ElementRef<HTMLDivElement>;

  activeEditor: 'titulo' | 'descripcion' = 'descripcion';
  currentColor = '#0b3b25';

  form: EncuestaForm = this.createEmptyForm();

  minFechaPublicacion = '';
  minFechaCierre = '';

  constructor(
    private readonly router: Router,
    private readonly http: HttpClient,
    private readonly encuestaApi: EncuestaApi,
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const iso = hoy.toISOString().slice(0, 10);
    this.minFechaPublicacion = iso;
    this.minFechaCierre = iso;

    const borrador = history.state?.borrador as Partial<EncuestaForm> | undefined;
    if (borrador) {
      // Merge del borrador con defaults seguros
      this.form = {
        ...this.createEmptyForm(),
        ...borrador,
        opciones: borrador.opciones ?? [],
        tipoSeleccion: borrador.tipoSeleccion ?? 'single',
      };
    }
  }

  ngAfterViewInit(): void {
    if (this.tituloEditor) {
      this.tituloEditor.nativeElement.innerHTML = this.form.titulo || '';
    }
    if (this.descripcionEditor) {
      this.descripcionEditor.nativeElement.innerHTML = this.form.descripcion || '';
    }
  }

  // HELPERS
  private createEmptyForm(): EncuestaForm {
    return {
      titulo: '',
      descripcion: '',
      fechaPublicacion: '',
      fechaCierre: '',
      activa: true,
      opciones: [],
      tipoSeleccion: 'single',
    };
  }

  private toIsoDate(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr;
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toISOString();
  }

  getMinFechaCierre(): string {
    return this.form.fechaPublicacion || this.minFechaCierre;
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

  //NAVEGACIÓN
  onVolver(): void {
    this.router.navigate(['/menu-principal/admin/biblioteca']);
  }

  onBorrar(): void {
    this.form = this.createEmptyForm();
    if (this.tituloEditor) this.tituloEditor.nativeElement.innerHTML = '';
    if (this.descripcionEditor) this.descripcionEditor.nativeElement.innerHTML = '';
  }

  onPrevisualizar(): void {
    if (!this.form.fechaPublicacion || !this.form.fechaCierre) {
      alert('Las fechas de publicación y cierre son obligatorias para previsualizar.');
      return;
    }

    if (this.tituloEditor) {
      this.form.titulo = this.tituloEditor.nativeElement.innerHTML;
    }
    if (this.descripcionEditor) {
      this.form.descripcion = this.descripcionEditor.nativeElement.innerHTML;
    }

    this.router.navigate(
      ['/menu-principal/admin/biblioteca/encuestas/preview'],
      { state: { borrador: this.form } }
    );
  }

  onPublicar(): void {
    if (!this.form.fechaPublicacion || !this.form.fechaCierre) {
      alert('Las fechas de publicación y cierre son obligatorias.');
      return;
    }

    // Trae el HTML actual de los editores
    if (this.tituloEditor) this.form.titulo = this.tituloEditor.nativeElement.innerHTML;
    if (this.descripcionEditor) this.form.descripcion = this.descripcionEditor.nativeElement.innerHTML;

    // Bloque JSON embebido
    const encuestaJSON = {
      __meta: 'encuesta:v1',
      tipoSeleccion: this.form.tipoSeleccion, // 'single' | 'multiple'
      opciones: this.form.opciones.map(o => ({ id: o.id, texto: o.texto, detalle: o.detalle ?? undefined })),
    };

    const descripcionConJson =
      `${(this.form.descripcion || '').trim()}\n<!--ENCUESTA_JSON${JSON.stringify(encuestaJSON)}-->`;

    // usa any como en contenidos para no romper el dto del back
    const payload: any = {
      idAdmin: 1, //id real
      titulo: (this.form.titulo || '').trim(),
      descripcion: descripcionConJson,
      fechaPublicacion: this.toIsoDate(this.form.fechaPublicacion),
      fechaCierre: this.toIsoDate(this.form.fechaCierre),
      activa: this.form.activa,
    };

    this.encuestaApi.create(payload).subscribe({
      next: () => {
        alert('Encuesta creada correctamente.');
        this.router.navigate(['/menu-principal/admin/biblioteca']);
      },
      error: (err) => {
        console.error('Error creando encuesta', err);
        alert('Ocurrió un error al crear la encuesta.');
      },
    });
  }

  // EDITOR RICO
  setActiveEditor(editor: 'titulo' | 'descripcion') {
    this.activeEditor = editor;
  }

  onTituloChange(event: Event) {
    const target = event.target as HTMLElement;
    let text = target.innerText || '';
    const max = 300;
    if (text.length > max) {
      text = text.slice(0, max);
      target.innerText = text;
    }
    this.form.titulo = target.innerHTML;
  }

  onDescripcionChange(event: Event) {
    const target = event.target as HTMLElement;
    let text = target.innerText || '';
    const max = 5000;
    if (text.length > max) {
      text = text.slice(0, max);
      target.innerText = text;
    }
    this.form.descripcion = target.innerHTML;
  }

  format(cmd: string) {
    document.execCommand(cmd, false);
  }

  private formatWithValue(cmd: string, value: string) {
    document.execCommand(cmd, false, value);
  }

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

  // OPCIONES (BORRADOR)
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

  private static readonly ENCJSON_START = '__ENCUESTA_JSON_START__';
  private static readonly ENCJSON_END = '__ENCUESTA_JSON_END__';

  private buildDescripcionWithEmbeddedJson(html: string): string {
    const json = {
      encuestaMeta: { version: 1, tipoSeleccion: this.form.tipoSeleccion },
      opciones: (this.form.opciones || []).map((o, i) => ({
        id: o.id, texto: o.texto, detalle: o.detalle ?? null, orden: i,
      })),
    };
    const packed = `<!--${CrearEncuestaComponent.ENCJSON_START}${JSON.stringify(json)}${CrearEncuestaComponent.ENCJSON_END}-->`;

    const cleaned = (html || '').replace(
      new RegExp(`<!--${CrearEncuestaComponent.ENCJSON_START}[\\s\\S]*?${CrearEncuestaComponent.ENCJSON_END}-->`, 'g'),
      ''
    ).trim();

    return `${cleaned}\n${packed}`;
  }
}
