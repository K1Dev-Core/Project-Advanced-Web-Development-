import { Component, effect, input, signal } from '@angular/core';
import { Notice } from '../../shared/notice';

@Component({
  selector: 'request-state',
  imports: [Notice],
  template: `@if (busy()) {
      <div class="request-skeleton" role="status" aria-label="กำลังโหลดข้อมูล">
        <span class="sr-only">กำลังดำเนินการ…</span><i></i><i></i><i></i>
      </div>
    }
    @if (!dismissed() && (error() || success())) {
      <app-notice
        [message]="error() || success()"
        [error]="!!error()"
        (dismiss)="dismissed.set(true)"
      />
    }`,
})
export class RequestState {
  busy = input(false);
  error = input('');
  success = input('');
  dismissed = signal(false);

  constructor() {
    effect((onCleanup) => {
      const error = this.error();
      const success = this.success();
      this.dismissed.set(false);
      if (success && !error) {
        const timer = setTimeout(() => this.dismissed.set(true), 5000);
        onCleanup(() => clearTimeout(timer));
      }
    });
  }
}
