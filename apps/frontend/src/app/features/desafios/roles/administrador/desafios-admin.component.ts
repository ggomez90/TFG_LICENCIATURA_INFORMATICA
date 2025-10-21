// apps/frontend/src/app/features/desafios/roles/administrador/desafios-admin.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-desafios-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './desafios-admin.component.html',
  styleUrls: ['./desafios-admin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesafiosAdminComponent {}
