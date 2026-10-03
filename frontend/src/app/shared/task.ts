import { signal } from '@angular/core';
// Each page owns its request state. Errors stay visible and writes cannot double-submit.
export class Task {
  busy = signal(false);
  error = signal('');
  success = signal('');
  async run(work: () => Promise<void>, message = '') {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.success.set('');
    try {
      await work();
      this.success.set(message);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'ดำเนินการไม่สำเร็จ');
    } finally {
      this.busy.set(false);
    }
  }
}
