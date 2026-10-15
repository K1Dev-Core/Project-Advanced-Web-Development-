import { Notice } from './notice';
import { Component, input, signal, effect } from '@angular/core';
import { labels } from '../../core/models';
@Component({
  selector: 'page-title',
  template: `<div class="page-title">
    <div>
      <h1>{{ title() }}</h1>
      <p>{{ description() }}</p>
    </div>
    <ng-content />
  </div>`,
})
export class PageTitle {
  title = input.required<string>();
  description = input('');
}
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
      const error = this.error(),
        success = this.success();
      this.dismissed.set(false);
      if (success && !error) {
        const timer = setTimeout(() => this.dismissed.set(true), 5000);
        onCleanup(() => clearTimeout(timer));
      }
    });
  }
}
@Component({
  selector: 'delivery-status',
  template: `<span class="status" [attr.data-status]="value()">{{
    labels[value()] || value()
  }}</span>`,
})
export class DeliveryStatus {
  value = input.required<string>();
  labels = labels;
}
