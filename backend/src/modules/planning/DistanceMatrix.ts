import { GeoMath, GeoPoint } from "../../shared/geo/GeoPoint";

export class DistanceMatrix {
  static readonly DEPOT = 0;

  private readonly values: number[][];

  constructor(depot: GeoPoint, locations: GeoPoint[], roadFactor: number) {
    const points = [depot, ...locations];
    this.values = points.map((from) => points.map((to) => GeoMath.haversineKm(from, to) * roadFactor));
  }

  between(from: number, to: number): number {
    return this.values[from][to];
  }

  fromDepot(orderIndex: number): number {
    return this.values[DistanceMatrix.DEPOT][orderIndex + 1];
  }

  betweenOrders(a: number, b: number): number {
    return this.values[a + 1][b + 1];
  }
}
