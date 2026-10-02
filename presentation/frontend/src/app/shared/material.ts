import { Injectable } from '@angular/core';
import {
  NativeDateAdapter,
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { MatDatepickerIntl } from '@angular/material/datepicker';

@Injectable()
export class ThaiDateAdapter extends NativeDateAdapter {
  override parse(value: unknown): Date | null {
    if (value instanceof Date) return value;
    if (typeof value !== 'string' || !value.trim()) return null;
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    const thai = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    if (!iso && !thai) return this.invalid();
    const parts = iso ? [+iso[1], +iso[2], +iso[3]] : [+thai![3], +thai![2], +thai![1]];
    if (parts[0] >= 2400) parts[0] -= 543;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    return date.getFullYear() === parts[0] &&
      date.getMonth() === parts[1] - 1 &&
      date.getDate() === parts[2]
      ? date
      : this.invalid();
  }
}
const intl = new MatDatepickerIntl();
Object.assign(intl, {
  calendarLabel: 'ปฏิทิน',
  openCalendarLabel: 'เลือกวันที่',
  closeCalendarLabel: 'ปิดปฏิทิน',
  prevMonthLabel: 'เดือนก่อน',
  nextMonthLabel: 'เดือนถัดไป',
  prevYearLabel: 'ปีก่อน',
  nextYearLabel: 'ปีถัดไป',
  prevMultiYearLabel: 'ช่วงปีก่อน',
  nextMultiYearLabel: 'ช่วงปีถัดไป',
  switchToMonthViewLabel: 'เลือกเดือน',
  switchToMultiYearViewLabel: 'เลือกปี',
});
export const dateProviders = [
  { provide: DateAdapter, useClass: ThaiDateAdapter },
  { provide: MAT_DATE_LOCALE, useValue: 'th-TH-u-ca-gregory' },
  { provide: MatDatepickerIntl, useValue: intl },
  {
    provide: MAT_DATE_FORMATS,
    useValue: {
      parse: { dateInput: 'dd/MM/yyyy' },
      display: {
        dateInput: { day: '2-digit', month: '2-digit', year: 'numeric' },
        monthYearLabel: { month: 'short', year: 'numeric' },
        dateA11yLabel: { day: 'numeric', month: 'long', year: 'numeric' },
        monthYearA11yLabel: { month: 'long', year: 'numeric' },
      },
    },
  },
];
