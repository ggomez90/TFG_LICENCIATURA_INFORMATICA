import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type Recurso = {
  id: string;
  tipo: 'Guía' | 'Video' | 'Infografía' | 'FAQ';
  titulo: string;
  desc: string;
  icon: string; // SVG path (currentColor)
};

@Component({
  selector: 'app-biblioteca-cliente',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './biblioteca-cliente.component.html',
  styleUrls: ['./biblioteca-cliente.component.scss'],
})
export class BibliotecaClienteComponent {
  q = signal('');
  recursos = signal<Recurso[]>([
    { id: 'g1', tipo: 'Guía', titulo: 'Separación en origen (paso a paso)', desc: 'Cómo separar plástico, papel, vidrio y orgánicos en casa.', icon: 'M5 3h14a2 2 0 0 1 2 2v2H3V5a2 2 0 0 1 2-2zm16 6v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9h18z' },
    { id: 'v1', tipo: 'Video', titulo: '¿Qué es reciclable y qué no?', desc: 'Clip de 2 minutos para toda la familia.', icon: 'M8 5v14l11-7L8 5z' },
    { id: 'i1', tipo: 'Infografía', titulo: 'Calendario de recolección', desc: 'Días y horarios por barrio.', icon: 'M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z' },
    { id: 'f1', tipo: 'FAQ', titulo: 'Preguntas frecuentes', desc: 'Respuestas rápidas a dudas comunes.', icon: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z' },
    { id: 'g2', tipo: 'Guía', titulo: 'Limpieza de envases', desc: 'Buenas prácticas para entregar material en buen estado.', icon: 'M5 3h14a2 2 0 0 1 2 2v2H3V5a2 2 0 0 1 2-2z' },
    { id: 'v2', tipo: 'Video', titulo: 'Reciclaje en Ceres', desc: 'Conocé el circuito local y la cooperativa.', icon: 'M8 5v14l11-7L8 5z' },
  ]);

  tipos = ['Todos', 'Guía', 'Video', 'Infografía', 'FAQ'];
  filtro = signal<'Todos' | 'Guía' | 'Video' | 'Infografía' | 'FAQ'>('Todos');

  listFiltrada = () => {
    const k = this.q().toLowerCase();
    return this.recursos().filter(r =>
      (this.filtro() === 'Todos' || r.tipo === this.filtro()) &&
      (r.titulo.toLowerCase().includes(k) || r.desc.toLowerCase().includes(k))
    );
  };
}
