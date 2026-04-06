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
import { DesafioApi, DesafioCreateDto } from '../../../../../api/desafio.api';

type EstadoDesafio = 1 | 2 | 3; // 1=ACTIVO, 2=PAUSADO, 3=FINALIZADO

interface DesafioForm {
  titulo: string;
  descripcion: string;
  tipoResiduo: string;
  requiereInscripcion: boolean;
  unidadMedida: string;
  meta: string; // texto decimal
  puntosTotales: number; // entero
  puntosPorUnidad: string; // texto decimal
  bonificacionDesafioCompleto: string; // texto entero
  otorgaPuntosParcial: boolean;
  fechaInicio: string; // YYYY-MM-DD
  fechaFin: string | null; // YYYY-MM-DD | null
  estado: EstadoDesafio;
  idRecursoEducativo: string; // texto entero
}

@Component({
  selector: 'app-crear-desafio-administrador',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './crear-desafio-administrador.component.html',
  styleUrls: ['./crear-desafio-administrador.component.scss'],
})
export class CrearDesafioAdministradorComponent implements OnInit, AfterViewInit {
  @ViewChild('tituloEditor') tituloEditor?: ElementRef<HTMLDivElement>;
  @ViewChild('descripcionEditor') descripcionEditor?: ElementRef<HTMLDivElement>;

  activeEditor: 'titulo' | 'descripcion' = 'descripcion';
  currentColor = '#0b3b25';

  form: DesafioForm = this.emptyForm();
  minFechaInicio = '';
  loading = false;

  constructor(
    private readonly router: Router,
    private readonly api: DesafioApi,
  ) {}

  ngOnInit(): void {
    this.minFechaInicio = this.todayInTz('America/Argentina/Cordoba');

    // Restaurar borrador si volvemos desde preview
    const borrador = history.state?.borrador as DesafioForm | undefined;
    if (borrador) this.form = { ...borrador };
  }

  ngAfterViewInit(): void {
    if (this.tituloEditor) this.tituloEditor.nativeElement.innerHTML = this.form.titulo || '';
    if (this.descripcionEditor) this.descripcionEditor.nativeElement.innerHTML = this.form.descripcion || '';
  }

  // Navegación

  onVolver(): void {
    this.router.navigate(['/menu-principal/admin/desafios']);
  }

  onBorrar(): void {
    this.form = this.emptyForm();
    if (this.tituloEditor) this.tituloEditor.nativeElement.innerHTML = '';
    if (this.descripcionEditor) this.descripcionEditor.nativeElement.innerHTML = '';
  }

  onPrevisualizar(): void {
    if (!this.form.fechaInicio) {
      alert('La fecha de inicio es obligatoria.');
      return;
    }
    if (this.form.fechaFin && this.form.fechaFin < this.form.fechaInicio) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (this.tituloEditor) this.form.titulo = this.tituloEditor.nativeElement.innerHTML;
    if (this.descripcionEditor) this.form.descripcion = this.descripcionEditor.nativeElement.innerHTML;

    this.router.navigate(
      ['/menu-principal', 'admin', 'desafios', 'nuevo', 'preview'],
      { state: { borrador: this.form } },
    );
  }

  // Submit del formulario
  onCrear(): void {
    if (!this.form.fechaInicio) {
      alert('La fecha de inicio es obligatoria.');
      return;
    }
    if (this.form.fechaFin && this.form.fechaFin < this.form.fechaInicio) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio.');
      return;
    }

    if (this.tituloEditor) this.form.titulo = this.tituloEditor.nativeElement.innerHTML;
    if (this.descripcionEditor) this.form.descripcion = this.descripcionEditor.nativeElement.innerHTML;

    const dto = this.toCreateDto(this.form);
    this.loading = true;
    this.api.create(dto).subscribe({
      next: () => {
        this.loading = false;
        alert('Desafío creado correctamente.');
        this.router.navigate(['/menu-principal/admin/desafios']);
      },
      error: (err) => {
        this.loading = false;
        console.error('Error creando desafío', err);
        alert('Ocurrió un error al crear el desafío.');
      },
    });
  }

  //Helpers

  private emptyForm(): DesafioForm {
    return {
      titulo: '',
      descripcion: '',
      tipoResiduo: '',
      requiereInscripcion: false,
      unidadMedida: '',
      meta: '',
      puntosTotales: 0,
      puntosPorUnidad: '',
      bonificacionDesafioCompleto: '',
      otorgaPuntosParcial: false,
      fechaInicio: '',
      fechaFin: null,
      estado: 1,
      idRecursoEducativo: '',
    };
  }

  /** Hoy en la TZ dada como YYYY-MM-DD */
  private todayInTz(tz: string): string {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return fmt.format(new Date()); // YYYY-MM-DD
  }

  /** Mapea el formulario al DTO del API. */
  private toCreateDto(f: DesafioForm): DesafioCreateDto {
    const idAdmin = 1;

    const parseDecimal = (v: string): number | null => {
      const t = (v ?? '').trim();
      if (!t) return null;
      const normalized = t.replace(',', '.');
      const n = Number(normalized);
      return Number.isFinite(n) ? n : null;
    };

    const parseIntStr = (v: string): number | null => {
      const t = (v ?? '').trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isInteger(n) ? n : null;
    };

    return {
      idAdmin,
      titulo: f.titulo?.trim() || undefined,
      descripcion: f.descripcion?.trim() || undefined,
      tipoResiduo: f.tipoResiduo?.trim() || '',
      requiereInscripcion: !!f.requiereInscripcion,
      unidadMedida: f.unidadMedida?.trim() || '',
      meta: parseDecimal(f.meta) ?? 0,
      puntosTotales: Number.isInteger(f.puntosTotales) ? f.puntosTotales : 0,
      puntosPorUnidad: parseDecimal(f.puntosPorUnidad) ?? null,
      bonificacionDesafioCompleto: parseIntStr(f.bonificacionDesafioCompleto) ?? null,
      otorgaPuntosParcial: !!f.otorgaPuntosParcial,
      fechaInicio: f.fechaInicio,
      fechaFin: f.fechaFin ?? undefined,
      estado: f.estado,
      idRecursoEducativo: (() => {
        const n = parseIntStr(f.idRecursoEducativo);
        return n == null ? undefined : n;
      })(),
    };
  }

  getMinFechaFin(): string {
    return this.form.fechaInicio || this.minFechaInicio;
  }

  // Sanitizadores y validadores de inputs

  /** Permite sólo dígitos y UN punto, impide punto en primera posición
   * BLOQUEA escribir más de 2 decimales */
  decimalKeydown(e: KeyboardEvent, current: string) {
    const allowedControl = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'Home', 'End',
    ];
    if (allowedControl.includes(e.key)) return;

    // Atajos (Ctrl/Cmd + A/C/V/X)
    if ((e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(e.key.toLowerCase())) return;

    const input = e.target as HTMLInputElement;
    const value = current ?? '';
    const start = input.selectionStart ?? value.length;
    const end   = input.selectionEnd   ?? value.length;

    // Punto decimal
    if (e.key === '.') {
      const hasDot = value.includes('.');
      const caretAtStart = start === 0 && end === 0;
      if (hasDot || caretAtStart) e.preventDefault();
      return;
    }

    // Dígitos
    if (/^[0-9]$/.test(e.key)) {
      // Simulamos el valor resultante si se inserta en la posición actual
      const before = value.slice(0, start);
      const after  = value.slice(end);
      const next   = before + e.key + after;

      const dotIdx = next.indexOf('.');
      if (dotIdx >= 0) {
        const decimalsLen = next.length - (dotIdx + 1);
        if (decimalsLen > 2) {
          e.preventDefault();
          return;
        }
      }
      return; // dígito permitido
    }

    // Cualquier otro carácter, bloquear
    e.preventDefault();
  }

  // Sólo dígitos enteros
  integerKeydown(e: KeyboardEvent) {
    const allowedControl = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'Home', 'End',
    ];
    if (allowedControl.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(e.key.toLowerCase())) return;
    if (/^[0-9]$/.test(e.key)) return;
    e.preventDefault();
  }

  // Normaliza decimales y limita a 2 dígitos luego del punto.
  private normalizeDecimalInput(v: string): string {
    let s = (v || '').replace(/[^\d.]/g, '');

    // dejar sólo el primer punto
    const firstDot = s.indexOf('.');
    if (firstDot !== -1) {
      const left = s.slice(0, firstDot + 1);
      const right = s.slice(firstDot + 1).replace(/\./g, '');
      s = left + right;
      // limitar a 2 decimales
      const parts = s.split('.');
      if (parts[1] != null) parts[1] = parts[1].slice(0, 2);
      s = parts.join('.');
    }

    if (s.startsWith('.')) s = '0' + s;
    return s;
  }

  onMetaInput(ev: Event) {
    this.form.meta = this.normalizeDecimalInput((ev.target as HTMLInputElement).value);
  }
  onPuntosUnidadInput(ev: Event) {
    this.form.puntosPorUnidad = this.normalizeDecimalInput((ev.target as HTMLInputElement).value);
  }
  onPuntosTotalesInput(ev: Event) {
    const raw = (ev.target as HTMLInputElement).value || '';
    this.form.puntosTotales = Number((raw.replace(/\D+/g, '') || '0'));
  }
  onBonificacionInput(ev: Event) {
    const t = (ev.target as HTMLInputElement).value || '';
    this.form.bonificacionDesafioCompleto = t.replace(/\D+/g, '');
  }
  onIdRecursoChange(ev: Event) {
    const t = (ev.target as HTMLInputElement).value || '';
    this.form.idRecursoEducativo = t.replace(/\D+/g, '');
  }

  // Switch dependiente de puntosPorUnidad
  onToggleParcial(ev: Event) {
    const input = (ev.target as HTMLInputElement);
    const wants = input.checked;
    if (wants && !this.form.puntosPorUnidad.trim()) {
      input.checked = false;
      this.form.otorgaPuntosParcial = false;
      alert('Para otorgar puntos parciales, primero completá "Puntos por unidad".');
      return;
    }
    this.form.otorgaPuntosParcial = wants;
  }

  //EDITOR
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
  onFontFamilyChange(event: Event) { const v = (event.target as HTMLSelectElement).value; if (v) this.formatWithValue('fontName', v); }
  onFontSizeChange(event: Event) { const v = (event.target as HTMLSelectElement).value; if (v) this.formatWithValue('fontSize', v); }
  onColorChange(event: Event) { const v = (event.target as HTMLInputElement).value; if (!v) return; this.currentColor = v; this.formatWithValue('foreColor', v); }
  clearFormat() { document.execCommand('removeFormat', false); document.execCommand('unlink', false); }
}
