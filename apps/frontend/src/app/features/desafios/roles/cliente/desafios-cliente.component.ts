//El codigo no posee logica para esta feature, los datos son estaticos y solo decorativos para simular una vista
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
