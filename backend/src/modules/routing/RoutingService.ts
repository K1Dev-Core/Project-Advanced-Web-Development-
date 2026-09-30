import { GeoPoint } from "../../shared/geo/GeoPoint";
import { EstimatedRoutingProvider } from "./EstimatedRoutingProvider";
import { DistanceTable, RoutePath, RoutingProvider } from "./RoutingProvider";

export class RoutingService {
  constructor(
    private readonly primary: RoutingProvider | null,
    private readonly concurrency: number,
  ) {}

  async table(points: GeoPoint[], roadFactor: number): Promise<DistanceTable> {
    const fallback = new EstimatedRoutingProvider(roadFactor);
    if (!this.primary || points.length < 2) {
      return fallback.table(points);
    }
    try {
      return await this.primary.table(points);
    } catch (error) {
      console.warn(`Routing table fallback: ${(error as Error).message}`);
      return fallback.table(points);
    }
  }

  async paths(sequences: GeoPoint[][], roadFactor: number): Promise<RoutePath[]> {
    const fallback = new EstimatedRoutingProvider(roadFactor);
    const results: RoutePath[] = new Array(sequences.length);
    let cursor = 0;
    let primaryHealthy = this.primary !== null;

    const worker = async () => {
      while (cursor < sequences.length) {
        const index = cursor++;
        const points = sequences[index];
        if (primaryHealthy && this.primary && points.length >= 2) {
          try {
            results[index] = await this.primary.path(points);
            continue;
          } catch (error) {
            primaryHealthy = false;
            console.warn(`Routing path fallback: ${(error as Error).message}`);
          }
        }
        results[index] = await fallback.path(points);
      }
    };

    await Promise.all(Array.from({ length: Math.max(1, Math.min(this.concurrency, sequences.length)) }, worker));
    return results;
  }
}
