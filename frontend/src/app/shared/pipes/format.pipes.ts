import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'baht' })
export class BahtPipe implements PipeTransform {
  private static readonly formatter = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2, minimumFractionDigits: 0 });

  transform(value: number | null | undefined, sign = false): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    const prefix = sign && value > 0 ? '+' : '';
    return `${prefix}฿${BahtPipe.formatter.format(value)}`;
  }
}

@Pipe({ name: 'km' })
export class KmPipe implements PipeTransform {
  transform(value: number | null | undefined, digits = 1): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    return value < 1 ? `${Math.round(value * 1000)} ม.` : `${value.toFixed(digits)} กม.`;
  }
}

@Pipe({ name: 'minutes' })
export class MinutesPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return '-';
    }
    const minutes = Math.round(value);
    return minutes >= 60 ? `${Math.floor(minutes / 60)} ชม. ${minutes % 60} นาที` : `${minutes} นาที`;
  }
}

@Pipe({ name: 'thaiDate' })
export class ThaiDatePipe implements PipeTransform {
  private static readonly formatter = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });

  transform(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }
    const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    return Number.isNaN(date.getTime()) ? value : ThaiDatePipe.formatter.format(date);
  }
}

@Pipe({ name: 'initial' })
export class InitialPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    const text = (value ?? '').trim();
    const match = text.match(/[ก-ฮA-Za-z0-9]/u);
    return match ? match[0].toUpperCase() : '?';
  }
}

export const FORMAT_PIPES = [BahtPipe, KmPipe, MinutesPipe, ThaiDatePipe, InitialPipe] as const;
