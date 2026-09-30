import { ObjectiveStrategy, RouteMetrics } from "./ObjectiveStrategy";

export class DistanceObjective extends ObjectiveStrategy {
  readonly key = "distance" as const;
  readonly label = "ระยะทางรวมสั้นที่สุด";
  readonly description = "Minimize the total kilometers driven by every rider";

  protected baseScore(metrics: RouteMetrics): number {
    return metrics.distanceKm * 100 + metrics.riderFee * 0.001;
  }
}
