import { GeoPoint } from "../../shared/geo/GeoPoint";
import { DistanceTable, RoutePath, RoutingProvider } from "./RoutingProvider";

interface OsrmTableResponse {
  code: string;
  message?: string;
  distances?: (number | null)[][];
}

interface OsrmRouteResponse {
  code: string;
  message?: string;
  routes?: { distance: number; geometry: { coordinates: [number, number][] } }[];
}

export type FetchLike = (url: string, init?: { signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export class OsrmRoutingProvider implements RoutingProvider {
  readonly name = "osrm";

  constructor(
    private readonly baseUrl: string,
    private readonly profile: string,
    private readonly timeoutMs: number,
    private readonly fetcher: FetchLike = fetch,
  ) {}

  async table(points: GeoPoint[]): Promise<DistanceTable> {
    const body = await this.request<OsrmTableResponse>(
      `${this.baseUrl}/table/v1/${this.profile}/${this.coordinates(points)}?annotations=distance`,
    );
    if (!body.distances || body.distances.length !== points.length) {
      throw new Error("OSRM table response has no distances");
    }
    const distances = body.distances;
    if (distances.some((row) => row.some((value) => value === null || !Number.isFinite(value)))) {
      throw new Error("OSRM could not route between some locations");
    }
    return {
      distancesKm: distances.map((row) => row.map((meters) => Number(meters) / 1000)),
      source: "road",
    };
  }

  async path(points: GeoPoint[]): Promise<RoutePath> {
    const body = await this.request<OsrmRouteResponse>(
      `${this.baseUrl}/route/v1/${this.profile}/${this.coordinates(points)}?overview=full&geometries=geojson&steps=false`,
    );
    const route = body.routes?.[0];
    if (!route) {
      throw new Error("OSRM route response has no route");
    }
    return {
      distanceKm: route.distance / 1000,
      geometry: route.geometry.coordinates.map(([longitude, latitude]) => ({ latitude, longitude })),
      source: "road",
    };
  }

  private async request<T extends { code: string; message?: string }>(url: string): Promise<T> {
    const response = await this.fetcher(url, { signal: AbortSignal.timeout(this.timeoutMs) });
    if (!response.ok) {
      throw new Error(`OSRM responded with HTTP ${response.status}`);
    }
    const body = (await response.json()) as T;
    if (body.code !== "Ok") {
      throw new Error(`OSRM error ${body.code}: ${body.message ?? "unknown"}`);
    }
    return body;
  }

  private coordinates(points: GeoPoint[]): string {
    return points.map((point) => `${point.longitude.toFixed(6)},${point.latitude.toFixed(6)}`).join(";");
  }
}
