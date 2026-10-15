import { Component, ElementRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Api } from '../services/api';
import { today } from '../models/models';
import { Icon } from '../components/ui/icon';
import { DateControl } from './date-control';
import { RequestState } from '../components/ui/request-state';

type Kind = 'bundle' | 'customers' | 'orders' | 'riders';
interface Created {
  kind: string;
  count: number;
  seed: number;
  customersCreated?: number;
}
interface Generated {
  created: number;
  seed: number;
  customersCreated?: number;
}
@Component({
  selector: 'dev-tools',
  imports: [FormsModule, RouterLink, Icon, DateControl, RequestState],
  templateUrl: './dev-tools.html',
  styleUrl: './dev-tools.css',
})
export class DevTools {
  api = inject(Api);
  dialog = viewChild<ElementRef<HTMLDialogElement>>('panel');
  calendar = viewChild(DateControl);
  opened = signal(false);
  busy = signal(false);
  error = signal('');
  step = signal('');
  results = signal<Created[]>([]);
  kind: Kind = 'bundle';
  customerCount = 20;
  orderCount = 20;
  riderCount = 3;
  deliveryDate = today();
  radiusKm = 3;
  seed: number | null = null;
  private changed = false;
  choices: { kind: Kind; label: string; icon: string }[] = [
    { kind: 'bundle', label: 'ชุดพร้อมลอง', icon: 'spark' },
    { kind: 'customers', label: 'ลูกค้า', icon: 'users' },
    { kind: 'orders', label: 'รายการสั่งอาหาร', icon: 'box' },
    { kind: 'riders', label: 'ไรเดอร์', icon: 'truck' },
  ];
  includes(kind: Kind) {
    return this.kind === 'bundle' || this.kind === kind;
  }
  open() {
    this.opened.set(true);
    this.dialog()?.nativeElement.showModal();
  }
  close() {
    if (!this.busy()) this.dialog()?.nativeElement.close();
  }
  calendarEscape(event: Event) {
    if (this.dialog()?.nativeElement.querySelector('mat-calendar')) {
      event.preventDefault();
      event.stopPropagation();
      this.calendar()?.closeCalendar();
    }
  }
  guardClose(event: Event) {
    if (this.busy()) event.preventDefault();
  }
  closed() {
    this.opened.set(false);
    if (this.changed) {
      this.changed = false;
      window.dispatchEvent(new Event('dev-data-created'));
    }
  }
  async generate() {
    if (this.busy() || !this.api.token()) return;
    const validCount = (count: number, max: number) =>
      Number.isInteger(count) && count >= 1 && count <= max;
    if (
      (this.includes('customers') && !validCount(this.customerCount, 500)) ||
      (this.includes('orders') &&
        (!validCount(this.orderCount, 500) || !/^\d{4}-\d{2}-\d{2}$/.test(this.deliveryDate))) ||
      (this.includes('riders') && !validCount(this.riderCount, 100)) ||
      (this.includes('customers') && !(this.radiusKm >= 0.2 && this.radiusKm <= 50)) ||
      (this.seed !== null &&
        (!Number.isInteger(this.seed) || this.seed < 0 || this.seed > 4294967295))
    ) {
      this.error.set('กรุณาตรวจสอบจำนวน วันที่ และรัศมีที่กรอก');
      return;
    }
    this.error.set('');
    this.results.set([]);
    this.busy.set(true);
    const seed = this.seed === null ? {} : { seed: this.seed };
    try {
      if (this.includes('customers'))
        await this.create('customers', 'ลูกค้า', {
          count: this.customerCount,
          radiusKm: this.radiusKm,
          minRadiusKm: 0.2,
          ...seed,
        });
      if (this.includes('riders'))
        await this.create('riders', 'ไรเดอร์', { count: this.riderCount, ...seed });
      if (this.includes('orders'))
        await this.create('orders', 'รายการสั่งอาหาร', {
          count: this.orderCount,
          deliveryDate: this.deliveryDate,
          clearExisting: false,
          ensureCustomers: true,
          uniqueCustomers: true,
          ...seed,
        });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'สร้างข้อมูลไม่สำเร็จ');
    } finally {
      this.busy.set(false);
      this.step.set('');
    }
  }
  private async create(kind: Kind, label: string, body: object) {
    this.step.set('กำลังสร้าง' + label + '…');
    const { data } = await this.api.request<Generated>('/simulations/' + kind, 'POST', body);
    this.changed = true;
    this.results.update((results) => [
      ...results,
      {
        kind: label,
        count: data.created,
        seed: data.seed,
        customersCreated: data.customersCreated,
      },
    ]);
  }
}
