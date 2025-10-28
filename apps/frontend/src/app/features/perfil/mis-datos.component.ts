//proximo modulo a desarrollar, por el momento solo datos estaticos para mostrar en la vista
import { Component, signal } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { RouterModule } from '@angular/router';

type Usuario = {
  idUsuario: number;
  nombres?: string | null;
  apellidos?: string | null;
  razonSocial?: string | null;
  dniCuitCuil: string;
  direccion: string;
  localidad: string;
  provincia: string;
  usuario: string;
  email: string;
  rol: string;      // 'ADMIN' | 'OPERARIO' | 'CLIENTE'
  estado: boolean;
  puntos: number;
};

@Component({
  selector: 'app-mis-datos',
  standalone: true,
  imports: [CommonModule, RouterModule, NgIf],
  templateUrl: './mis-datos.component.html',
  styleUrls: ['./mis-datos.component.scss'],
})
export class MisDatosComponent {
  //reemplazar luego con datos reales del backend
  usuario = signal<Usuario>({
    idUsuario: 101,
    nombres: 'María',
    apellidos: 'Gómez',
    razonSocial: null,
    dniCuitCuil: '30-12345678-9',
    direccion: 'San Martín 123',
    localidad: 'Ceres',
    provincia: 'Santa Fe',
    usuario: 'mgomez',
    email: 'maria.gomez@example.com',
    rol: 'CLIENTE',
    estado: true,
    puntos: 420,
  });
}
