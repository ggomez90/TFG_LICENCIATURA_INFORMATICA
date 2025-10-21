// apps/frontend/src/app/features/desafios/roles/cliente/desafios-cliente.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-desafios-cliente',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './desafios-cliente.component.html',
  styleUrls: ['./desafios-cliente.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesafiosClienteComponent {}
