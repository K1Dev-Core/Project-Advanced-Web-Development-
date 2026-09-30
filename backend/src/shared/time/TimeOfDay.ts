export class TimeOfDay {
  private constructor(readonly totalMinutes: number) {}

  static parse(value: string): TimeOfDay {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
    if (!match) {
      throw new Error(`Invalid time "${value}"`);
    }
    return new TimeOfDay(Number(match[1]) * 60 + Number(match[2]));
  }

  addMinutes(minutes: number): TimeOfDay {
    return new TimeOfDay(this.totalMinutes + minutes);
  }

  toString(): string {
    const normalized = ((Math.floor(this.totalMinutes) % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }
}
