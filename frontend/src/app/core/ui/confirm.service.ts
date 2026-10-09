import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface PendingConfirm extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly pending = signal<PendingConfirm | null>(null);

  readonly current = this.pending.asReadonly();

  ask(options: ConfirmOptions): Promise<boolean> {
    this.pending()?.resolve(false);
    return new Promise<boolean>((resolve) => this.pending.set({ ...options, resolve }));
  }

  answer(value: boolean): void {
    const pending = this.pending();
    this.pending.set(null);
    pending?.resolve(value);
  }
}
