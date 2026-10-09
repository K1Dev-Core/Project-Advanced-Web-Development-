import { Component, input } from '@angular/core';

@Component({
  selector: 'app-brand',
  template: `
    <div class="brand" [class.light]="light()">
      <svg class="mark" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="18" fill="#ff5a1f" />
        <path d="M14 30h36l-3 16a6 6 0 0 1-6 5H23a6 6 0 0 1-6-5z" fill="#fff" />
        <path d="M12 28h40a2 2 0 0 1 0 4H12a2 2 0 0 1 0-4z" fill="#ffd3bf" />
        <path d="M24 22c0-4 4-7 8-7s8 3 8 7" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" />
      </svg>
      @if (!compact()) {
        <div class="name">
          <strong>ข้าวกล่อง</strong>
          <span>ส่งด่วนมื้อเที่ยง</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .brand {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .mark {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
      }
      .name {
        display: flex;
        flex-direction: column;
        line-height: 1.15;
      }
      strong {
        font-size: 17px;
        font-weight: 700;
      }
      span {
        font-size: 12px;
        color: var(--muted);
      }
      .light strong {
        color: #fff;
      }
      .light span {
        color: rgba(255, 255, 255, 0.8);
      }
    `,
  ],
})
export class BrandComponent {
  readonly compact = input(false);
  readonly light = input(false);
}
