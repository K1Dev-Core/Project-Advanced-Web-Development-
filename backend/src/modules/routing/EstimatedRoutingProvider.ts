import { GeoMath, GeoPoint } from "../../shared/geo/GeoPoint";
import { DistanceTable, RoutePath, RoutingProvider } from "./RoutingProvider";

export class EstimatedRoutingProvider implements RoutingProvider {
  readonly name = "estimate";

  constructor(private readonly roadFactor: number) {}

  async table(points: GeoPoint[]): Promise<DistanceTable> {
    return {
      distancesKm: points.map((from) => points.map((to) => this.distance(from, to))),
      source: "estimated",
    };
  }

  async path(points: GeoPoint[]): Promise<RoutePath> {
    let distanceKm = 0;
    for (let index = 1; index < points.length; index++) {
      distanceKm += this.distance(points[index - 1], points[index]);
    }
    return { distanceKm, geometry: points, source: "estimated" };
  }

  distance(from: GeoPoint, to: GeoPoint): number {
    return GeoMath.haversineKm(from, to) * this.roadFactor;
  }
}
