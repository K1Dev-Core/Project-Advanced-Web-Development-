import { Component, input, output } from '@angular/core';
import { Stop } from '../../models/models';
import { DeliveryStatus } from '../ui/delivery-status';
import { Icon } from '../ui/icon';

@Component({
  imports: [Icon, DeliveryStatus],
  selector: 'delivery-stop-card',
  styleUrl: './delivery-stop-card.css',
  templateUrl: './delivery-stop-card.html',
})
export class DeliveryStopCard {
  stop = input.required<Stop>();
  jobStatus = input.required<string>();
  busy = input(false);
  stopAction = output<'deliver' | 'undo'>();
}
