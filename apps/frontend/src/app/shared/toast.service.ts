import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';
export interface ToastItem {
  id: number;
  type: ToastType;
  text: string;
  ttlMs: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _items = signal<ToastItem[]>([]);
  items = this._items.asReadonly();

  private nextId = 1;

  show(type: ToastType, text: string, ttlMs = 4000) {
    const id = this.nextId++;
    const item: ToastItem = { id, type, text, ttlMs };
    this._items.update(arr => [...arr, item]);
    setTimeout(() => this.dismiss(id), ttlMs);
  }

  success(text: string, ttlMs?: number) { this.show('success', text, ttlMs); }
  error(text: string, ttlMs?: number) { this.show('error', text, ttlMs); }
  info(text: string, ttlMs?: number) { this.show('info', text, ttlMs); }

  dismiss(id: number) {
    this._items.update(arr => arr.filter(t => t.id !== id));
  }
}
