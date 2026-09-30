import { PlanObjective } from "../PlanningTypes";
import { BalancedObjective } from "./BalancedObjective";
import { CostObjective } from "./CostObjective";
import { DistanceObjective } from "./DistanceObjective";
import { ObjectiveStrategy } from "./ObjectiveStrategy";
import { TimeObjective } from "./TimeObjective";

export class ObjectiveFactory {
  private static readonly strategies: Record<PlanObjective, ObjectiveStrategy> = {
    cost: new CostObjective(),
    distance: new DistanceObjective(),
    time: new TimeObjective(),
    balanced: new BalancedObjective(),
  };

  static create(objective: PlanObjective): ObjectiveStrategy {
    return ObjectiveFactory.strategies[objective];
  }

  static all(): ObjectiveStrategy[] {
    return Object.values(ObjectiveFactory.strategies);
  }
}
