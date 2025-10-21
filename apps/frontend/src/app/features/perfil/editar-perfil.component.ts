import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type FormUsuario = {
  nombres?: string | null;
  apellidos?: string | null;
  razonSocial?: string | null;
  dniCuitCuil: string;
  direccion: string;
  localidad: string;
  provincia: string;
  usuario: string;
  email: string;
};

@Component({
  selector: 'app-editar-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './editar-perfil.component.html',
  styleUrls: ['./editar-perfil.component.scss'],
})
export class EditarPerfilComponent {
  // 🔹 Mock: inicializar con los datos actuales
  form = signal<FormUsuario>({
    nombres: 'María',
    apellidos: 'Gómez',
    razonSocial: '',
    dniCuitCuil: '30-12345678-9',
    direccion: 'San Martín 123',
    localidad: 'Ceres',
    provincia: 'Santa Fe',
    usuario: 'mgomez',
    email: 'maria.gomez@example.com',
  });

  onChange<K extends keyof FormUsuario>(key: K, value: string) {
    const v = (value ?? '').trim();
    this.form.update(f => ({ ...f, [key]: v }));
  }

  guardar() {
    // TODO: llamar a backend (PUT /perfil)
    console.log('Guardar perfil →', this.form());
    alert('Perfil guardado (mock).');
  }
}
