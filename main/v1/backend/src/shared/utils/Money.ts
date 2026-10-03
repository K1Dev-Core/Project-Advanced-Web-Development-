export class Money {
  static round(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  static sum(values: number[]): number {
    return Money.round(values.reduce((total, value) => total + value, 0));
  }
}
