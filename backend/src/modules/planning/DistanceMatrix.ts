import { GeoMath, GeoPoint } from "../../shared/geo/GeoPoint";
import { DistanceSource } from "../routing/RoutingProvider";

export class DistanceMatrix {
  static readonly DEPOT = 0;

  constructor(
    private readonly values: number[][],
    readonly source: DistanceSource,
  ) {}

  static estimated(depot: GeoPoint, locations: GeoPoint[], roadFactor: number): DistanceMatrix {
    const points = [depot, ...locations];
    return new DistanceMatrix(
      points.map((from) => points.map((to) => GeoMath.haversineKm(from, to) * roadFactor)),
      "estimated",
    );
  }

  get size(): number {
    return this.values.length;
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
