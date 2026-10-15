import { MatSelectModule } from '@angular/material/select';
import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DeliveryRoute, Rider } from '../models/models';
import { DeliveryStatus } from '../components/ui/delivery-status';
@Component({
  selector: 'route-card',
  imports: [MatSelectModule, FormsModule, DecimalPipe, DeliveryStatus],
  template: `<section class="panel route-card">
    <div class="section-heading">
      <h2>เส้นทาง {{ route().sequence }}</h2>
      <delivery-status [value]="route().status" />
    </div>
    <p>
      {{ route().orderCount }} จุด · {{ route().boxCount }} กล่อง ·
      {{ route().distanceKm | number: '1.1-1' }} กม. · กำไร ฿{{ route().profit | number: '1.0-0' }}
    </p>
    <p class="hint">ถึงครบ {{ route().finishTime }} น. · {{ route().lateStops ? 'เกินเวลา ' + route().lateStops + ' จุด' : 'ทันเวลา' }}</p>
    <label
      >ไรเดอร์<mat-select
        [ngModel]="route().rider?.id || ''"
        (ngModelChange)="assign.emit($event)"
        [disabled]="!editable() || busy()"
        aria-label="ไรเดอร์"
      >
        <mat-option value="" data-value="">เลือกไรเดอร์</mat-option>
        @for (rider of riders(); track rider.id) {
          <mat-option [value]="rider.id" [attr.data-value]="rider.id">{{ rider.name }}</mat-option>
        }
      </mat-select></label
    >
    <ol class="stop-list">
      @for (stop of route().stops; track stop.id) {
        <li>
          <strong>{{ stop.customerName }}</strong
          ><small>{{ stop.boxes }} กล่อง · ถึงตามแผน {{ stop.eta }}{{ stop.late ? ' · เกินกำหนด' : '' }}</small>
        </li>
      }
    </ol>
    @if (showJob()) {
      <a class="button" [href]="'/rider/jobs/' + route().jobCode"
        >เปิดใบงาน {{ route().jobCode }}</a
      >
    }
  </section>`,
})
export class RouteCard {
  route = input.required<DeliveryRoute>();
  riders = input<Rider[]>([]);
  editable = input(false);
  busy = input(false);
  showJob = input(false);
  assign = output<number | string>();
}
