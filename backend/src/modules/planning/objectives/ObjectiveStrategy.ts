import { PlanObjective } from "../PlanningTypes";
import { RouteEvaluation } from "../RouteEvaluation";

export type RouteMetrics = Omit<RouteEvaluation, "score">;

export abstract class ObjectiveStrategy {
  static readonly LATE_PENALTY_PER_MINUTE = 10000;
  static readonly LATE_PENALTY_PER_STOP = 100000;

  abstract readonly key: PlanObjective;
  abstract readonly label: string;
  abstract readonly description: string;

  score(metrics: RouteMetrics): number {
    return (
      this.baseScore(metrics) +
      metrics.lateMinutes * ObjectiveStrategy.LATE_PENALTY_PER_MINUTE +
      metrics.lateStops * ObjectiveStrategy.LATE_PENALTY_PER_STOP
    );
  }

  protected abstract baseScore(metrics: RouteMetrics): number;
}
