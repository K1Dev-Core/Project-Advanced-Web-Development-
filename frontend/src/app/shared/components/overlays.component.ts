import { Component, inject } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ConfirmService } from '../../core/ui/confirm.service';
import { ToastService } from '../../core/ui/toast.service';

@Component({
  selector: 'app-overlays',
  imports: [LucideAngularModule],
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toasts.toasts(); track toast.id) {
        <div class="toast" [attr.data-kind]="toast.kind" (click)="toasts.dismiss(toast.id)">
          <lucide-icon
            [name]="toast.kind === 'success' ? 'circle-check' : toast.kind === 'error' ? 'triangle-alert' : 'info'"
            [size]="20"
          ></lucide-icon>
          <span>{{ toast.message }}</span>
        </div>
      }
    </div>

    @if (confirm.current(); as dialog) {
      <div class="backdrop" (click)="confirm.answer(false)"></div>
      <div class="dialog" role="alertdialog" aria-modal="true">
        <div class="badge-icon" [class.danger]="dialog.danger">
          <lucide-icon [name]="dialog.danger ? 'triangle-alert' : 'info'" [size]="24"></lucide-icon>
        </div>
        <h3>{{ dialog.title }}</h3>
        <p class="muted">{{ dialog.message }}</p>
        <div class="row actions">
          <button class="btn outline" type="button" (click)="confirm.answer(false)">{{ dialog.cancelText ?? 'ยกเลิก' }}</button>
          <button
            class="btn"
            [class.primary]="!dialog.danger"
            [class.danger-solid]="dialog.danger"
            type="button"
            (click)="confirm.answer(true)"
          >
            {{ dialog.confirmText ?? 'ตกลง' }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .toasts {
        position: fixed;
        z-index: 1500;
        right: 20px;
        top: 20px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        width: min(380px, calc(100vw - 32px));
      }
      .toast {
        display: flex;
        gap: 10px;
        align-items: flex-start;
        padding: 12px 14px;
        border-radius: 14px;
        background: var(--ink);
        color: #fff;
        box-shadow: var(--shadow-lg);
        font-size: 14px;
        cursor: pointer;
        animation: slide 0.2s ease;
      }
      .toast[data-kind='success'] lucide-icon {
        color: #5ee08f;
      }
      .toast[data-kind='error'] {
        background: #3a1415;
      }
      .toast[data-kind='error'] lucide-icon {
        color: #ff8a8c;
      }
      .backdrop {
        position: fixed;
        inset: 0;
        z-index: 1300;
        background: rgba(20, 14, 10, 0.42);
      }
      .dialog {
        position: fixed;
        z-index: 1301;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        width: min(400px, calc(100vw - 32px));
        background: #fff;
        border-radius: var(--radius-lg);
        padding: 24px;
        text-align: center;
        box-shadow: var(--shadow-lg);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      .badge-icon {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        background: var(--brand-50);
        color: var(--brand-600);
        margin-bottom: 4px;
      }
      .badge-icon.danger {
        background: var(--red-50);
        color: var(--red);
      }
      p {
        font-size: 14px;
      }
      .actions {
        margin-top: 12px;
        width: 100%;
      }
      .actions .btn {
        flex: 1;
      }
      .danger-solid {
        background: var(--red);
        color: #fff;
      }
      @media (max-width: 640px) {
        .toasts {
          top: auto;
          bottom: calc(84px + var(--safe-bottom));
          left: 16px;
          right: 16px;
          width: auto;
        }
      }
      @keyframes slide {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
      }
    `,
  ],
})
export class OverlaysComponent {
  protected readonly toasts = inject(ToastService);
  protected readonly confirm = inject(ConfirmService);
}
