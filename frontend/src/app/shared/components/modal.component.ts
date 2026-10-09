import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-modal',
  imports: [LucideAngularModule],
  template: `
    @if (open()) {
      <div class="backdrop" (click)="closed.emit()"></div>
      <section class="sheet" [class.wide]="wide()" role="dialog" aria-modal="true">
        <header>
          <h3>{{ title() }}</h3>
          <button class="btn ghost icon sm" type="button" (click)="closed.emit()" aria-label="ปิด">
            <lucide-icon name="x" [size]="20"></lucide-icon>
          </button>
        </header>
        <div class="body"><ng-content></ng-content></div>
        <footer><ng-content select="[modal-footer]"></ng-content></footer>
      </section>
    }
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgba(20, 14, 10, 0.42);
        backdrop-filter: blur(2px);
        z-index: 1200;
        animation: fade 0.15s ease;
      }
      .sheet {
        position: fixed;
        z-index: 1201;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: min(520px, calc(100vw - 32px));
        max-height: calc(100vh - 48px);
        display: flex;
        flex-direction: column;
        background: #fff;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-lg);
        animation: pop 0.18s ease;
      }
      .sheet.wide {
        width: min(860px, calc(100vw - 32px));
      }
      header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 18px 20px 10px;
      }
      .body {
        padding: 8px 20px 16px;
        overflow-y: auto;
      }
      footer {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
        padding: 12px 20px 18px;
        border-top: 1px solid var(--line);
      }
      footer:empty {
        display: none;
      }
      @media (max-width: 640px) {
        .sheet,
        .sheet.wide {
          left: 0;
          right: 0;
          top: auto;
          bottom: 0;
          transform: none;
          width: 100%;
          max-height: 92vh;
          border-radius: 22px 22px 0 0;
          padding-bottom: var(--safe-bottom);
          animation: up 0.22s ease;
        }
      }
      @keyframes fade {
        from {
          opacity: 0;
        }
      }
      @keyframes pop {
        from {
          opacity: 0;
          transform: translate(-50%, -46%);
        }
      }
      @keyframes up {
        from {
          transform: translateY(40px);
          opacity: 0;
        }
      }
    `,
  ],
})
export class ModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly wide = input(false);
  readonly closed = output<void>();
}
