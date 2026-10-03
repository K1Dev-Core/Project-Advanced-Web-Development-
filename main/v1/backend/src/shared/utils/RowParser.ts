export class RowParser {
  static json<T>(value: unknown, fallback: T): T {
    if (value === null || value === undefined) {
      return fallback;
    }
    if (typeof value === "string") {
      try {
        return JSON.parse(value) as T;
      } catch {
        return fallback;
      }
    }
    return value as T;
  }

  static date(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  static bool(value: unknown): boolean {
    return value === true || value === 1 || value === "1";
  }
}
