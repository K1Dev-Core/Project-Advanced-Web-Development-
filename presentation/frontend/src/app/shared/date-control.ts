import { dateProviders } from './material';
import {
  Component,
  booleanAttribute,
  forwardRef,
  Input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
@Component({
  selector: 'app-date',
  imports: [MatDatepickerModule, MatInputModule],
  providers: [
    ...dateProviders,
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateControl), multi: true },
  ],
  template: `<div class="date-control">
    <input
      #field
      matInput
      [matDatepicker]="picker"
      [value]="date()"
      [disabled]="disabledState()"
      [required]="required"
      [id]="inputId"
      [attr.aria-label]="label"
      placeholder="วว/ดด/ปปปป"
      (dateInput)="update($event.value, field)"
      (dateChange)="commit()"
      (blur)="touched()"
      autocomplete="off"
    /><mat-datepicker-toggle [for]="picker" [disabled]="disabledState()" /><mat-datepicker
      #picker
    />
  </div>`,
})
export class DateControl implements ControlValueAccessor {
  private picker = viewChild.required<MatDatepicker<Date>>('picker');
  async closeCalendar() {
    const picker = this.picker();
    const popup = document.getElementById(picker.id)?.closest('.mat-datepicker-content');
    await Promise.allSettled((popup?.getAnimations() || []).map((animation) => animation.finished));
    picker.close();
  }
  @Input() label = 'วันที่จัดส่ง';
  @Input() inputId = '';
  @Input({ transform: booleanAttribute }) required = false;
  @Input() set disabled(value: boolean) {
    this.disabledState.set(value);
  }
  disabledState = signal(false);
  date = signal<Date | null>(null);
  changed = output<void>();
  private onChange: (value: string) => void = () => {};
  touched: () => void = () => {};
  writeValue(value: unknown) {
    const match = typeof value === 'string' && /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    this.date.set(match ? new Date(+match[1], +match[2] - 1, +match[3]) : null);
  }
  registerOnChange(fn: (value: string) => void) {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void) {
    this.touched = fn;
  }
  setDisabledState(value: boolean) {
    this.disabledState.set(value);
  }
  update(date: Date | null, input: HTMLInputElement) {
    const valid = !!date && !isNaN(date.getTime());
    this.date.set(valid ? date : null);
    input.setCustomValidity(!valid && input.value ? 'กรุณาระบุวันที่ให้ถูกต้อง' : '');
    this.onChange(
      valid
        ? `${date!.getFullYear()}-${String(date!.getMonth() + 1).padStart(2, '0')}-${String(date!.getDate()).padStart(2, '0')}`
        : '',
    );
  }
  commit() {
    this.touched();
    if (this.date()) this.changed.emit();
  }
}
