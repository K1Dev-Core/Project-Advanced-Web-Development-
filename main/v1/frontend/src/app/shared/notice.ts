import { Component, input, output } from '@angular/core';
import { Icon } from '../components/ui/icon';
@Component({
  selector: 'app-notice',
  imports: [Icon],
  template: `<div
    class="notification"
    [class.failed]="error()"
    [attr.role]="error() ? 'alert' : 'status'"
  >
    <span class="notification-icon"><ui-icon [name]="error() ? 'help' : 'check'" /></span>
    <div>
      <strong>{{ error() ? 'ดำเนินการไม่สำเร็จ' : 'เรียบร้อยแล้ว' }}</strong>
      <p>{{ message() }}</p>
    </div>
    <button type="button" aria-label="ปิดแจ้งเตือน" (click)="dismiss.emit()">
      <ui-icon name="close" />
    </button>
  </div>`,
  styles: [
    `
      .notification {
        position: fixed;
        z-index: 2000;
        top: max(16px, env(safe-area-inset-top));
        left: 50%;
        transform: translateX(-50%);
        width: min(440px, calc(100vw - 32px));
        box-sizing: border-box;
        display: flex;
        gap: 12px;
        align-items: center;
        padding: 14px;
        border: 1px solid #ffffffd9;
        border-radius: 8px;
        background: #fffaf5f5;
        backdrop-filter: blur(18px);
        box-shadow: 0 4px 16px rgb(28 28 30 / 14%);
        color: #1c1c1e;
        animation: arrive 0.22s ease-out;
        font:
          14px 'Noto Sans Thai',
          sans-serif;
      }
      .notification-icon {
        flex-shrink: 0;
        width: 38px;
        height: 38px;
        border-radius: 5px;
        background: #e5f3e7;
        color: #28623c;
        display: grid;
        place-items: center;
      }
      .failed .notification-icon {
        background: #ffe8df;
        color: #a13714;
      }
      strong {
        font-size: 14px;
      }
      p {
        margin: 3px 0 0;
        line-height: 1.5;
        overflow-wrap: anywhere;
      }
      .notification > div {
        flex: 1;
        min-width: 0;
      }
      button {
        display: grid;
        place-items: center;
        min-width: 44px;
        min-height: 44px;
        border: 0;
        border-radius: 4px;
        background: transparent;
        color: #69574f;
        cursor: pointer;
        padding: 0;
      }
      button:focus-visible {
        outline: 2px solid #b74418;
      }
      @keyframes arrive {
        from {
          opacity: 0;
          translate: 0 -12px;
        }
        to {
          opacity: 1;
          translate: 0 0;
        }
      }
      @media (prefers-reduced-motion: reduce) {
        .notification {
          animation: none;
        }
      }
    `,
  ],
})
export class Notice {
  message = input.required<string>();
  error = input(false);
  dismiss = output<void>();
}
