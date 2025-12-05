import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContenidoApi } from '../../../../../api/contenido.api';

interface ContenidoForm {
  titulo: string;
  descripcion: string;
  urlRecurso: string;
  fechaPublicacion: string;
  fechaBaja: string | null;
  visible: boolean;
}

@Component({
  selector: 'app-crear-contenido-educativo',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './crear-contenido-educativo.component.html',
  styleUrls: ['./crear-contenido-educativo.component.scss'],
})
export class CrearContenidoEducativoComponent implements OnInit, AfterViewInit {
  @ViewChild('tituloEditor') tituloEditor?: ElementRef<HTMLDivElement>;
  @ViewChild('descripcionEditor') descripcionEditor?: ElementRef<HTMLDivElement>;

  activeEditor: 'titulo' | 'descripcion' = 'descripcion';
  currentColor = '#0b3b25';

  form: ContenidoForm = this.createEmptyForm();
  minFechaPublicacion = '';

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly contenidoApi: ContenidoApi,
  ) {}

  ngOnInit(): void {
    const hoy = new Date();
    const iso = hoy.toISOString().slice(0, 10);
    this.minFechaPublicacion = iso;

    const borrador = history.state?.borrador as ContenidoForm | undefined;
    if (borrador) this.form = { ...borrador };
  }

  ngAfterViewInit(): void {
    if (this.tituloEditor) this.tituloEditor.nativeElement.innerHTML = this.form.titulo || '';
    if (this.descripcionEditor) this.descripcionEditor.nativeElement.innerHTML = this.form.descripcion || '';
  }

  private createEmptyForm(): ContenidoForm {
    return {
      titulo: '',
      descripcion: '',
      urlRecurso: '',
      fechaPublicacion: '',
      fechaBaja: null,
      visible: true,
    };
  }

  getMinFechaBaja(): string {
    return this.form.fechaPublicacion || this.minFechaPublicacion;
  }

  onVolver(): void {
    this.router.navigate(['/menu-principal/admin/biblioteca']);
  }

  onBorrar(): void {
    this.form = this.createEmptyForm();
    if (this.tituloEditor) this.tituloEditor.nativeElement.innerHTML = '';
    if (this.descripcionEditor) this.descripcionEditor.nativeElement.innerHTML = '';
  }

  onPrevisualizar(): void {
    if (!this.form.fechaPublicacion) {
      alert('La fecha de publicación es obligatoria para previsualizar.');
      return;
    }
    if (this.tituloEditor) this.form.titulo = this.tituloEditor.nativeElement.innerHTML;
    if (this.descripcionEditor) this.form.descripcion = this.descripcionEditor.nativeElement.innerHTML;

    this.router.navigate(
      ['/menu-principal/admin/biblioteca/contenidos/preview'],
      { state: { borrador: this.form } },
    );
  }

  private toIsoDate(dateStr: string): string {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr;
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toISOString();
  }

  onPublicar(): void {
    if (!this.form.fechaPublicacion) {
      alert('La fecha de publicación es obligatoria.');
      return;
    }

    const payload: any = {
      idAdmin: 1,
      fechaPublicacion: this.toIsoDate(this.form.fechaPublicacion),
      visible: this.form.visible,
    };

    if (this.form.titulo?.trim()) payload.titulo = this.form.titulo.trim();
    if (this.form.descripcion?.trim()) payload.descripcion = this.form.descripcion.trim();
    if (this.form.urlRecurso?.trim()) payload.urlRecurso = this.form.urlRecurso.trim();
    if (this.form.fechaBaja) payload.fechaBaja = this.toIsoDate(this.form.fechaBaja);

    this.contenidoApi.create(payload).subscribe({
      next: () => {
        alert('Contenido publicado correctamente.');
        this.router.navigate(['/menu-principal/admin/biblioteca']);
      },
      error: (err) => {
        console.error('Error publicando contenido', 'status =', err?.status, 'body =', err?.error);
        alert('Ocurrió un error al publicar el contenido.');
      },
    });
  }

  setActiveEditor(editor: 'titulo' | 'descripcion') { this.activeEditor = editor; }

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
    const max = 500;
    if (text.length > max) {
      text = text.slice(0, max);
      target.innerText = text;
    }
    this.form.descripcion = target.innerHTML;
  }

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
}
