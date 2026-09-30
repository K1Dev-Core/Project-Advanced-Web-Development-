import { ObjectiveStrategy, RouteMetrics } from "./ObjectiveStrategy";

export class BalancedObjective extends ObjectiveStrategy {
  static readonly BAHT_PER_WAITING_MINUTE = 0.5;

  readonly key = "balanced" as const;
  readonly label = "สมดุลระหว่างต้นทุนและเวลา";
  readonly description = "Balance rider fee against customer waiting time";

  protected baseScore(metrics: RouteMetrics): number {
    return metrics.riderFee + metrics.sumArrivalMinutes * BalancedObjective.BAHT_PER_WAITING_MINUTE;
  }
}
