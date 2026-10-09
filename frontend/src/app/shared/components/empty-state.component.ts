import { Component, input } from '@angular/core';
import { FoodBoxIllustrationComponent } from '../illustrations/food-box-illustration.component';
import { RouteIllustrationComponent } from '../illustrations/route-illustration.component';

@Component({
  selector: 'app-empty-state',
  imports: [FoodBoxIllustrationComponent, RouteIllustrationComponent],
  template: `
    <div class="empty">
      <div class="art">
        @if (art() === 'route') {
          <app-route-illustration />
        } @else {
          <app-food-box-illustration />
        }
      </div>
      <h3>{{ title() }}</h3>
      @if (text()) {
        <p class="muted">{{ text() }}</p>
      }
      <div class="actions"><ng-content></ng-content></div>
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: 8px;
        padding: 36px 20px;
      }
      .art {
        width: 150px;
        margin-bottom: 6px;
      }
      p {
        max-width: 360px;
        font-size: 14px;
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: center;
        margin-top: 10px;
      }
      .actions:empty {
        display: none;
      }
    `,
  ],
})
export class EmptyStateComponent {
  readonly title = input.required<string>();
  readonly text = input('');
  readonly art = input<'box' | 'route'>('box');
}
