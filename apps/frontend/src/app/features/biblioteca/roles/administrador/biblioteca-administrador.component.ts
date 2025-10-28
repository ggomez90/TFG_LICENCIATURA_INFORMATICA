//El codigo no posee logica para esta feature, los datos son estaticos y solo decorativos para simular una vista

import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type AdminTile = {
  id: string;
  titulo: string;
  desc: string;
  icon: string;
  actionText: string;
};

@Component({
  selector: 'app-biblioteca-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './biblioteca-administrador.component.html',
  styleUrls: ['./biblioteca-administrador.component.scss'],
})
export class BibliotecaAdministradorComponent {
  tiles = signal<AdminTile[]>([
    { id: 'pub', titulo: 'Publicar recurso', desc: 'Cargar guías, videos o infografías y asignar categoría.', icon: 'M5 3h14a2 2 0 0 1 2 2v2H3V5a2 2 0 0 1 2-2zm16 6v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9h18z', actionText: 'NUEVO RECURSO →' },
    { id: 'cat', titulo: 'Gestionar categorías', desc: 'Crear, editar y desactivar categorías temáticas.', icon: 'M12 7a5 5 0 1 0 0 10A5 5 0 0 0 12 7z', actionText: 'VER CATEGORÍAS →' },
    { id: 'rev', titulo: 'Revisar reportes', desc: 'Sugerencias y correcciones reportadas por usuarios.', icon: 'M8 5v14l11-7L8 5z', actionText: 'REVISAR →' },
    { id: 'bor', titulo: 'Borradores', desc: 'Recursos cargados sin publicar para edición colaborativa.', icon: 'M12 2a10 10 0 1 0 0 20', actionText: 'ABRIR →' },
    { id: 'est', titulo: 'Estadísticas', desc: 'Top recursos vistos, descargas y clics por categoría.', icon: 'M3 17h2a6 6 0 0 0 6 6v-2a4 4 0 0 1-4-4H3zM3 7h2a6 6 0 0 1 6-6v2a4 4 0 0 0-4 4H3z', actionText: 'VER MÉTRICAS →' },
  ]);
}
