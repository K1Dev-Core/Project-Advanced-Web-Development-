export class BusinessCalendar {
  constructor(private readonly timezone: string) {}

  today(): string {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: this.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  resolve(date?: string): string {
    return date ?? this.today();
  }
}
