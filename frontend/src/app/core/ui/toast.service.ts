import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private sequence = 0;
  private readonly items = signal<Toast[]>([]);

  readonly toasts = this.items.asReadonly();

  success(message: string): void {
    this.push('success', message);
  }

  error(error: unknown): void {
    this.push('error', error instanceof Error ? error.message : String(error));
  }

  info(message: string): void {
    this.push('info', message);
  }

  dismiss(id: number): void {
    this.items.update((items) => items.filter((item) => item.id !== id));
  }

  private push(kind: ToastKind, message: string): void {
    const id = ++this.sequence;
    this.items.update((items) => [...items.slice(-3), { id, kind, message }]);
    setTimeout(() => this.dismiss(id), kind === 'error' ? 5000 : 3200);
  }
}
