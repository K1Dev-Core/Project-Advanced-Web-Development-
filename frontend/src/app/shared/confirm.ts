import { Component, Injectable, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { Icon } from '../components/ui/icon';
interface Confirmation {
  title: string;
  message: string;
  action: string;
}
@Component({
  imports: [MatDialogModule, Icon],
  template: `<div class="confirm-content">
    <span class="confirm-icon"><ui-icon name="help" /></span>
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <p mat-dialog-content>{{ data.message }}</p>
    <div mat-dialog-actions align="end">
      <button type="button" cdkFocusInitial (click)="ref.close(false)">ยกเลิก</button
      ><button type="button" class="primary" (click)="ref.close(true)">{{ data.action }}</button>
    </div>
  </div>`,
})
export class ConfirmDialog {
  data = inject<Confirmation>(MAT_DIALOG_DATA);
  ref = inject(MatDialogRef<ConfirmDialog>);
}
@Injectable({ providedIn: 'root' })
export class Confirm {
  private dialog = inject(MatDialog);
  async ask(title: string, message: string, action = 'ยืนยัน'): Promise<boolean> {
    return !!(await firstValueFrom(
      this.dialog
        .open(ConfirmDialog, {
          data: { title, message, action },
          width: '420px',
          maxWidth: 'calc(100vw - 32px)',
          panelClass: 'themed-confirm',
          autoFocus: 'button',
          restoreFocus: true,
        })
        .afterClosed(),
    ));
  }
}
