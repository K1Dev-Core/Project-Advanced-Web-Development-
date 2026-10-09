import { Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-stat-card',
  imports: [LucideAngularModule],
  template: `
    <div class="stat card" [attr.data-tone]="tone()">
      <div class="icon"><lucide-icon [name]="icon()" [size]="20"></lucide-icon></div>
      <div class="text">
        <span class="label">{{ label() }}</span>
        <strong class="value mono">{{ value() }}</strong>
        @if (hint()) {
          <span class="hint">{{ hint() }}</span>
        }
      </div>
    </div>
  `,
  styles: [
    `
      .stat {
        display: flex;
        gap: 14px;
        padding: 16px;
        align-items: flex-start;
        height: 100%;
      }
      .icon {
        width: 42px;
        height: 42px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: var(--brand-50);
        color: var(--brand-600);
        flex-shrink: 0;
      }
      [data-tone='green'] .icon {
        background: var(--green-50);
        color: var(--green);
      }
      [data-tone='blue'] .icon {
        background: var(--blue-50);
        color: var(--blue);
      }
      [data-tone='yellow'] .icon {
        background: var(--yellow-50);
        color: #b77900;
      }
      [data-tone='red'] .icon {
        background: var(--red-50);
        color: var(--red);
      }
      .text {
        display: flex;
        flex-direction: column;
        min-width: 0;
      }
      .label {
        font-size: 13px;
        color: var(--muted);
      }
      .value {
        font-size: 22px;
        font-weight: 600;
        line-height: 1.3;
      }
      .hint {
        font-size: 12px;
        color: var(--muted);
      }
      @media (max-width: 640px) {
        .stat {
          padding: 12px;
          gap: 10px;
          flex-direction: column;
        }
        .icon {
          width: 36px;
          height: 36px;
        }
        .value {
          font-size: 19px;
        }
      }
    `,
  ],
})
export class StatCardComponent {
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>('');
  readonly tone = input<'orange' | 'green' | 'blue' | 'yellow' | 'red'>('orange');
}
