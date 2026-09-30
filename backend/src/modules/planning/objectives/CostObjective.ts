import { ObjectiveStrategy, RouteMetrics } from "./ObjectiveStrategy";

export class CostObjective extends ObjectiveStrategy {
  readonly key = "cost" as const;
  readonly label = "ประหยัดค่าส่งที่สุด";
  readonly description = "Minimize the total rider fee so the shop keeps the highest profit";

  protected baseScore(metrics: RouteMetrics): number {
    return metrics.riderFee + metrics.distanceKm * 0.001;
  }
}
