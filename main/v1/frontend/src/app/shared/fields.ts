import { DateControl } from './date-control';
import { MatSelectModule } from '@angular/material/select';
import { Component, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
export type Values = Record<string, string | number | boolean>;
export interface Field {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { value: string | number; label: string }[];
}
@Component({
  selector: 'form-fields',
  imports: [DateControl, MatSelectModule, FormsModule],
  template: `<div class="form-grid">
    @for (field of fields(); track field.key) {
      <div class="field" [class.checkbox]="field.type === 'checkbox'">
        <label [for]="'field-' + field.key">{{ field.label }}</label>
        @if (field.options) {
          <mat-select
            [id]="'field-' + field.key"
            [name]="field.key"
            [(ngModel)]="values()[field.key]"
            [ngModelOptions]="{ standalone: true }"
            [required]="!!field.required"
            [aria-label]="field.label"
            [disabled]="disabled()"
          >
            @for (option of field.options; track option.value) {
              <mat-option [value]="option.value" [attr.data-value]="option.value">{{
                option.label
              }}</mat-option>
            }
          </mat-select>
        } @else if (field.type === 'date') {
          <app-date
            [inputId]="'field-' + field.key"
            [label]="field.label"
            [name]="field.key"
            [(ngModel)]="values()[field.key]"
            [ngModelOptions]="{ standalone: true }"
            [required]="!!field.required"
            [disabled]="disabled()"
          />
        } @else if (field.type === 'checkbox') {
          <input
            [id]="'field-' + field.key"
            type="checkbox"
            [name]="field.key"
            [(ngModel)]="values()[field.key]"
            [ngModelOptions]="{ standalone: true }"
          />
        } @else if (field.type === 'number') {
          <input
            [id]="'field-' + field.key"
            type="number"
            [name]="field.key"
            [(ngModel)]="values()[field.key]"
            [ngModelOptions]="{ standalone: true }"
            [required]="!!field.required"
            [min]="field.min ?? null"
            [max]="field.max ?? null"
            [step]="field.step ?? 'any'"
          />
        } @else {
          <input
            [id]="'field-' + field.key"
            [name]="field.key"
            [type]="field.type || 'text'"
            [(ngModel)]="values()[field.key]"
            [ngModelOptions]="{ standalone: true }"
            [required]="!!field.required"
            [min]="field.min ?? null"
            [max]="field.max ?? null"
            [step]="field.step ?? 'any'"
            [attr.maxlength]="field.type === 'number' ? null : 500"
          />
        }
      </div>
    }
  </div>`,
})
export class FormFields {
  disabled = input(false);
  fields = input.required<Field[]>();
  values = input.required<Values>();
}
