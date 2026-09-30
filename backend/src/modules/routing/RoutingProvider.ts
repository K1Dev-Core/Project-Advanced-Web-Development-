import { GeoPoint } from "../../shared/geo/GeoPoint";

export type DistanceSource = "road" | "estimated";

export interface DistanceTable {
  distancesKm: number[][];
  source: DistanceSource;
}

export interface RoutePath {
  distanceKm: number;
  geometry: GeoPoint[];
  source: DistanceSource;
}

export interface RoutingProvider {
  readonly name: string;
  table(points: GeoPoint[]): Promise<DistanceTable>;
  path(points: GeoPoint[]): Promise<RoutePath>;
}
