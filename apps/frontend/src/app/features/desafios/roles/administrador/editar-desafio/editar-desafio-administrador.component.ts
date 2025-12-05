import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DesafioApi, DesafioUpdateDto } from '../../../../../api/desafio.api';

type EstadoDesafio = 1 | 2 | 3;

interface DesafioForm {
  titulo: string;
  descripcion: string;
  tipoResiduo: string;
  requiereInscripcion: boolean;
  unidadMedida: string;

  // NO editables (sólo como display)
  meta: string; // texto
  puntosTotales: number;
  puntosPorUnidad: string;
  otorgaPuntosParcial: boolean; // bloqueado

  bonificacionDesafioCompleto: string; // editable (entero en string)
  fechaInicio: string;  // YYYY-MM-DD (display, bloqueado)
  fechaFin: string | null; // YYYY-MM-DD (editable, con mínima = fechaFinOriginal)
  estado: EstadoDesafio;

  idRecursoEducativo: string; // editable, entero en string
}

@Component({
  selector: 'app-editar-desafio-administrador',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './editar-desafio-administrador.component.html',
  styleUrls: ['./editar-desafio-administrador.component.scss'],
})
export class EditarDesafioAdministradorComponent implements OnInit, AfterViewInit {
  @ViewChild('tituloEditor') tituloEditor?: ElementRef<HTMLDivElement>;
  @ViewChild('descripcionEditor') descripcionEditor?: ElementRef<HTMLDivElement>;

  id!: number;

  // guardamos las “fechas originales” para validar fechaFin mínima
  private fechaInicioOriginalYmd = '';
  private fechaFinOriginalYmd: string | null = null;

  activeEditor: 'titulo' | 'descripcion' = 'descripcion';
  currentColor = '#0b3b25';

  form: DesafioForm = this.emptyForm();

  // flags
  loading = false;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: DesafioApi,
  ) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('idDesafio');
    this.id = Number(param);

    if (!this.id || Number.isNaN(this.id)) {
      alert('Identificador de desafío inválido.');
      this.onVolver();
      return;
    }

    // Tomamos datos desde el state (enviado desde el dashboard)
    const st = history.state?.item as any | undefined;
    if (!st) {
      alert('No se encontraron datos del desafío para editar.');
      this.onVolver();
      return;
    }

    // Normalizamos lo que viene del dashboard (igual que ver-desafio)
    const toYmd = (iso?: string | null) => {
      if (!iso) return null;
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const metaStr = ((): string => {
      const v = st.meta;
      if (v == null) return '';
      const n = typeof v === 'string' ? parseFloat(v) : v;
      return Number.isFinite(n) ? String(n) : '';
    })();

    const ppuStr = ((): string => {
      const v = st.puntosPorUnidad;
      if (v == null) return '';
      const n = typeof v === 'string' ? parseFloat(v) : v;
      return Number.isFinite(n) ? String(n) : '';
    })();

    this.form = {
      titulo: st.titulo ?? '',
      descripcion: st.descripcion ?? '',
      tipoResiduo: st.tipoResiduo ?? '',
      requiereInscripcion: !!st.requiereInscripcion,
      unidadMedida: st.unidadMedida ?? '',

      meta: metaStr,                     // display only
      puntosTotales: Number(st.puntosTotales ?? 0), // display only
      puntosPorUnidad: ppuStr,           // display only
      otorgaPuntosParcial: !!st.otorgaPuntosParcial, // display only (bloqueado)

      bonificacionDesafioCompleto: st.bonificacionDesafioCompleto?.toString?.() ?? '',
      fechaInicio: toYmd(st.fechaInicio) ?? '',
      fechaFin: toYmd(st.fechaFin),

      estado: (st.estado as EstadoDesafio) ?? 1,
      idRecursoEducativo: st.idRecursoEducativo?.toString?.() ?? '',
    };

    // guardamos “originales” para validación
    this.fechaInicioOriginalYmd = this.form.fechaInicio;
    this.fechaFinOriginalYmd = this.form.fechaFin;

    // precargar editores
    // (en AfterViewInit también, por si no existen aún los ViewChild)
    setTimeout(() => {
      if (this.tituloEditor) this.tituloEditor.nativeElement.innerHTML = this.form.titulo || '';
      if (this.descripcionEditor) this.descripcionEditor.nativeElement.innerHTML = this.form.descripcion || '';
    }, 0);
  }

  ngAfterViewInit(): void {
    if (this.tituloEditor) this.tituloEditor.nativeElement.innerHTML = this.form.titulo || '';
    if (this.descripcionEditor) this.descripcionEditor.nativeElement.innerHTML = this.form.descripcion || '';
  }

  from: 'dashboard' | 'listado' = (history.state?.from as any) ?? 'dashboard';

  private destinoLuego(): string[] {
    return this.from === 'listado'
      ? ['/menu-principal','admin','desafios','listado']
      : ['/menu-principal','admin','desafios'];
  }

  // ========= Navegación =========
  onVolver(): void {
    this.router.navigate(this.destinoLuego());
  }

  onBorrar(): void {
    // Limpia sólo los editables (no tiene mucho sentido aquí, pero mantenemos paridad)
    const keep = this.form;
    this.form = {
      ...this.emptyForm(),
      // volvemos a cargar los NO editables / fechas originales
      meta: keep.meta,
      puntosTotales: keep.puntosTotales,
      puntosPorUnidad: keep.puntosPorUnidad,
      otorgaPuntosParcial: keep.otorgaPuntosParcial,
      fechaInicio: this.fechaInicioOriginalYmd,
      fechaFin: this.fechaFinOriginalYmd,
    };
    if (this.tituloEditor) this.tituloEditor.nativeElement.innerHTML = '';
    if (this.descripcionEditor) this.descripcionEditor.nativeElement.innerHTML = '';
  }

  // ========= Submit =========
  onGuardar(): void {
    // actualizamos desde editores
    if (this.tituloEditor) this.form.titulo = this.tituloEditor.nativeElement.innerHTML;
    if (this.descripcionEditor) this.form.descripcion = this.descripcionEditor.nativeElement.innerHTML;

    // Validaciones:
    // - fechaInicio no editable
    // - fechaFin (si se informa) >= fechaFinOriginal (si existía), y en cualquier caso >= fechaInicio
    if (!this.form.fechaInicio) {
      alert('La fecha de inicio original no está disponible.');
      return;
    }
    if (this.form.fechaFin && this.form.fechaFin < this.form.fechaInicio) {
      alert('La fecha de fin debe ser igual o posterior a la fecha de inicio.');
      return;
    }
    if (this.fechaFinOriginalYmd && this.form.fechaFin && this.form.fechaFin < this.fechaFinOriginalYmd) {
      alert('No podés acortar la fecha de fin. Debe ser igual o posterior a la fecha de fin original.');
      return;
    }

    const parseIntStr = (v: string): number | null => {
      const t = (v ?? '').trim();
      if (!t) return null;
      const n = Number(t);
      return Number.isInteger(n) ? n : null;
    };

    // Armamos payload sólo con EDITABLES
    const payload: DesafioUpdateDto = {
      titulo: this.form.titulo?.trim() || undefined,
      descripcion: this.form.descripcion?.trim() || undefined,
      tipoResiduo: this.form.tipoResiduo?.trim() || undefined,
      requiereInscripcion: !!this.form.requiereInscripcion,
      unidadMedida: this.form.unidadMedida?.trim() || undefined,

      // meta / puntosTotales / puntosPorUnidad NO se envían

      bonificacionDesafioCompleto: (() => {
        const n = parseIntStr(this.form.bonificacionDesafioCompleto);
        return n == null ? null : n;
      })(),

      // otorgaPuntosParcial NO se envía

      // fechaInicio NO se envía
      fechaFin: this.form.fechaFin ?? undefined,

      estado: this.form.estado,
      idRecursoEducativo: (() => {
        const n = parseIntStr(this.form.idRecursoEducativo);
        return n == null ? undefined : n;
      })(),
    };

    this.loading = true;
    this.api.update(this.id, payload).subscribe({
      next: () => {
        this.loading = false;
        alert('Desafío actualizado correctamente.');
        this.router.navigate(this.destinoLuego());
      },
      error: (err) => {
        this.loading = false;
        console.error('Error actualizando desafío', err);
        alert('Ocurrió un error al actualizar el desafío.');
      },
    });
  }

  // ========= Helpers =========
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
      otorgaPuntosParcial: false,
      bonificacionDesafioCompleto: '',
      fechaInicio: '',
      fechaFin: null,
      estado: 1,
      idRecursoEducativo: '',
    };
  }

  getMinFechaFin(): string {
    // No permitir antes de la fechaInicio original (y si había fechaFin original, no permitir retroceder)
    return this.fechaFinOriginalYmd || this.fechaInicioOriginalYmd || '';
  }

  // ====== WYSIWYG ======
  setActiveEditor(editor: 'titulo' | 'descripcion') { this.activeEditor = editor; }
  onTituloChange(e: Event) {
    const el = e.target as HTMLElement;
    let text = el.innerText || '';
    const max = 300;
    if (text.length > max) { text = text.slice(0, max); el.innerText = text; }
    this.form.titulo = el.innerHTML;
  }
  onDescripcionChange(e: Event) {
    const el = e.target as HTMLElement;
    let text = el.innerText || '';
    const max = 500;
    if (text.length > max) { text = text.slice(0, max); el.innerText = text; }
    this.form.descripcion = el.innerHTML;
  }
  format(cmd: string) { document.execCommand(cmd, false); }
  private formatWithValue(cmd: string, value: string) { document.execCommand(cmd, false, value); }
  onFontFamilyChange(e: Event) { const v = (e.target as HTMLSelectElement).value; if (v) this.formatWithValue('fontName', v); }
  onFontSizeChange(e: Event) { const v = (e.target as HTMLSelectElement).value; if (v) this.formatWithValue('fontSize', v); }
  onColorChange(e: Event) { const v = (e.target as HTMLInputElement).value; if (!v) return; this.currentColor = v; this.formatWithValue('foreColor', v); }
  clearFormat() { document.execCommand('removeFormat', false); document.execCommand('unlink', false); }

  // ====== Inputs numéricos (idénticos a crear, para campos que quedan editables) ======
  integerKeydown(e: KeyboardEvent) {
    const allowed = ['Backspace','Delete','Tab','Escape','Enter','ArrowLeft','ArrowRight','Home','End'];
    if (allowed.includes(e.key)) return;
    if ((e.ctrlKey || e.metaKey) && ['a','c','v','x'].includes(e.key.toLowerCase())) return;
    if (/^[0-9]$/.test(e.key)) return;
    e.preventDefault();
  }
  onBonificacionInput(ev: Event) {
    const t = (ev.target as HTMLInputElement).value || '';
    this.form.bonificacionDesafioCompleto = t.replace(/\D+/g, '');
  }
  onIdRecursoChange(ev: Event) {
    const t = (ev.target as HTMLInputElement).value || '';
    this.form.idRecursoEducativo = t.replace(/\D+/g, '');
  }
}
