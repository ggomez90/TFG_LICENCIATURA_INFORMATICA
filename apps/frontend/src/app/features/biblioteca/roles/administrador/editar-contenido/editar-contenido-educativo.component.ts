import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ContenidoApi } from '../../../../../api/contenido.api';

interface ContenidoForm {
  titulo: string;
  descripcion: string;
  urlRecurso: string;
  fechaPublicacion: string;  // YYYY-MM-DD
  fechaBaja: string | null;
  visible: boolean;
}

interface ContenidoDetalle {
  idContenidoEducativo: number;
  idAdmin: number;
  titulo: string | null;
  descripcion: string | null;
  urlRecurso: string | null;
  fechaPublicacion: string;   // ISO
  fechaBaja?: string | null;
  visible: boolean;
}

@Component({
  selector: 'app-editar-contenido-educativo',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-contenido-educativo.component.html',
  styleUrls: ['./editar-contenido-educativo.component.scss'],
})
export class EditarContenidoEducativoComponent
  implements OnInit, AfterViewInit
{
  @ViewChild('tituloEditor') tituloEditor?: ElementRef<HTMLDivElement>;
  @ViewChild('descripcionEditor') descripcionEditor?: ElementRef<HTMLDivElement>;

  idContenido!: number;

  activeEditor: 'titulo' | 'descripcion' = 'descripcion';
  currentColor = '#0b3b25';

  form: ContenidoForm = this.createEmptyForm();

  minFechaPublicacion = '';

  loading = false;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef,
    private readonly contenidoApi: ContenidoApi,
  ) {}

  // CICLO DE VIDA

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('idContenido');
    const id = idParam ? Number(idParam) : null;

    if (!id) {
      alert('ID de contenido inválido.');
      this.onVolver();
      return;
    }

    this.idContenido = id;

    const hoy = new Date();
    const isoHoy = hoy.toISOString().slice(0, 10);
    this.minFechaPublicacion = isoHoy;

    this.cargarContenido();
  }

  ngAfterViewInit(): void {
    // Cuando los ViewChild ya existen va lo que haya en form
    this.syncEditorsFromForm();
  }

  //HELPERS

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

  //Transforma fechas YYYY-MM-DD en DD-MM-YYYY
  private isoToDateInput(iso: string | null | undefined): string {
    if (!iso) return '';
    return iso.slice(0, 10);
  }

  //fecha minima de baja
  getMinFechaBaja(): string {
    return this.form.fechaPublicacion || this.minFechaPublicacion;
  }

  //Copia el contenido del form a los editores visuales
  private syncEditorsFromForm(): void {
    if (this.tituloEditor) {
      this.tituloEditor.nativeElement.innerHTML = this.form.titulo || '';
    }
    if (this.descripcionEditor) {
      this.descripcionEditor.nativeElement.innerHTML =
        this.form.descripcion || '';
    }
  }

  //CARGA DESDE BACKEND

  private cargarContenido(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.contenidoApi.getAdminById(this.idContenido).subscribe({
      next: (resp) => {
        this.form = {
          titulo: resp.titulo ?? '',
          descripcion: resp.descripcion ?? '',
          urlRecurso: resp.urlRecurso ?? '',
          fechaPublicacion: this.isoToDateInput(resp.fechaPublicacion),
          fechaBaja: resp.fechaBaja ? this.isoToDateInput(resp.fechaBaja) : null,
          visible: resp.visible,
        };

        this.loading = false;

        // Sincroniza editores visuales
        this.syncEditorsFromForm();

        // Forzar refresco de la plantilla
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error cargando contenido para edición', err);
        this.loading = false;
        this.cdr.markForCheck();
        alert('No se pudo cargar el contenido para edición.');
        this.onVolver();
      },
    });
  }

  // NAVEGACIÓN

  onVolver(): void {
    this.router.navigate(['/menu-principal/admin/biblioteca']);
  }

  onBorrar(): void {
    this.form.titulo = '';
    this.form.descripcion = '';
    this.form.urlRecurso = '';
    this.form.fechaBaja = null;

    if (this.tituloEditor) {
      this.tituloEditor.nativeElement.innerHTML = '';
    }
    if (this.descripcionEditor) {
      this.descripcionEditor.nativeElement.innerHTML = '';
    }
  }

  onPrevisualizar(): void {
    if (this.tituloEditor) {
      this.form.titulo = this.tituloEditor.nativeElement.innerHTML;
    }
    if (this.descripcionEditor) {
      this.form.descripcion = this.descripcionEditor.nativeElement.innerHTML;
    }

    this.router.navigate(
      ['/menu-principal/admin/biblioteca/contenidos/preview'],
      {
        state: {
          borrador: this.form,
          modo: 'editar',
          idContenido: this.idContenido,
        },
      },
    );
  }

  // GUARDAR CAMBIOS (PATCH)

  private toIsoDate(dateStr: string): string {
    if (dateStr.includes('T')) return dateStr;
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(Date.UTC(year, month - 1, day));
    return d.toISOString();
  }

  onGuardar(): void {
    if (this.tituloEditor) {
      this.form.titulo = this.tituloEditor.nativeElement.innerHTML;
    }
    if (this.descripcionEditor) {
      this.form.descripcion = this.descripcionEditor.nativeElement.innerHTML;
    }

    const payload: any = {
      visible: this.form.visible,
    };

    if (this.form.titulo && this.form.titulo.trim()) {
      payload.titulo = this.form.titulo.trim();
    } else {
      payload.titulo = null;
    }

    if (this.form.descripcion && this.form.descripcion.trim()) {
      payload.descripcion = this.form.descripcion.trim();
    } else {
      payload.descripcion = null;
    }

    if (this.form.urlRecurso && this.form.urlRecurso.trim()) {
      payload.urlRecurso = this.form.urlRecurso.trim();
    } else {
      payload.urlRecurso = null;
    }

    if (this.form.fechaBaja) {
      payload.fechaBaja = this.toIsoDate(this.form.fechaBaja);
    } else {
      payload.fechaBaja = null;
    }

    this.contenidoApi.update(this.idContenido, payload).subscribe({
      next: () => {
        alert('Contenido actualizado correctamente.');
        this.onVolver();
      },
      error: (err) => {
        console.error(
          'Error actualizando contenido',
          'status =',
          err?.status,
          'body =',
          err?.error,
        );
        alert('Ocurrió un error al actualizar el contenido.');
      },
    });
  }

  // EDITOR

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
    const max = 500;

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
}
