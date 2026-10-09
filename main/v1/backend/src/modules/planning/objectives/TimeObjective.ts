import { ObjectiveStrategy, RouteMetrics } from "./ObjectiveStrategy";

export class TimeObjective extends ObjectiveStrategy {
  readonly key = "time" as const;
  readonly label = "ถึงมือลูกค้าเร็วที่สุด";
  readonly description = "Minimize the total waiting time of customers";

  protected baseScore(metrics: RouteMetrics): number {
    return metrics.sumArrivalMinutes * 100 + metrics.riderFee * 0.001;
  }
}
