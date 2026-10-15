import { Component, input } from '@angular/core';
import { labels } from '../../models/models';

@Component({
  selector: 'delivery-status',
  template: `<span class="status" [attr.data-status]="value()">{{ labels[value()] || value() }}</span>`,
})
export class DeliveryStatus {
  value = input.required<string>();
  labels = labels;
}
