import { DistanceMatrix } from "./DistanceMatrix";
import { ObjectiveStrategy, RouteMetrics } from "./objectives/ObjectiveStrategy";
import { PlanningParameters } from "./PlanningTypes";
import { RouteEvaluation } from "./RouteEvaluation";

export class RouteEvaluator {
  private static readonly EXHAUSTIVE_LIMIT = 7;

  private readonly cache = new Map<string, RouteEvaluation>();

  constructor(
    private readonly matrix: DistanceMatrix,
    private readonly boxes: number[],
    private readonly params: PlanningParameters,
    private readonly objective: ObjectiveStrategy,
  ) {}

  best(orderIndexes: number[]): RouteEvaluation {
    const key = [...orderIndexes].sort((a, b) => a - b).join(",");
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }
    const evaluation =
      orderIndexes.length <= RouteEvaluator.EXHAUSTIVE_LIMIT
        ? this.exhaustive(orderIndexes)
        : this.heuristic(orderIndexes);
    this.cache.set(key, evaluation);
    return evaluation;
  }

  score(orderIndexes: number[]): number {
    return orderIndexes.length === 0 ? 0 : this.best(orderIndexes).score;
  }

  evaluateSequence(sequence: number[]): RouteEvaluation {
    const legDistances: number[] = [];
    const cumulativeDistances: number[] = [];
    const arrivals: number[] = [];
    const minutesPerKm = 60 / this.params.riderSpeedKmh;

    let previous = -1;
    let distance = 0;
    let boxes = 0;
    let lateMinutes = 0;
    let lateStops = 0;
    let sumArrival = 0;

    sequence.forEach((orderIndex, position) => {
      const leg =
        previous < 0 ? this.matrix.fromDepot(orderIndex) : this.matrix.betweenOrders(previous, orderIndex);
      distance += leg;
      const arrival = distance * minutesPerKm + position * this.params.serviceMinutesPerStop;
      legDistances.push(leg);
      cumulativeDistances.push(distance);
      arrivals.push(arrival);
      sumArrival += arrival;
      boxes += this.boxes[orderIndex];
      if (arrival > this.params.deliveryWindowMinutes + 1e-9) {
        lateMinutes += arrival - this.params.deliveryWindowMinutes;
        lateStops += 1;
      }
      previous = orderIndex;
    });

    const lastArrival = arrivals.length > 0 ? arrivals[arrivals.length - 1] : 0;
    const metrics: RouteMetrics = {
      sequence: [...sequence],
      boxes,
      legDistances,
      cumulativeDistances,
      arrivals,
      distanceKm: distance,
      durationMinutes: lastArrival + (sequence.length > 0 ? this.params.serviceMinutesPerStop : 0),
      riderFee: this.params.riderBaseFee + this.params.riderFeePerKmPerBox * boxes * distance,
      lateMinutes,
      lateStops,
      sumArrivalMinutes: sumArrival,
    };
    return { ...metrics, score: this.objective.score(metrics) };
  }

  private exhaustive(orderIndexes: number[]): RouteEvaluation {
    let best: RouteEvaluation | undefined;
    for (const permutation of RouteEvaluator.permutations(orderIndexes)) {
      const evaluation = this.evaluateSequence(permutation);
      if (!best || evaluation.score < best.score - 1e-9) {
        best = evaluation;
      }
    }
    return best ?? this.evaluateSequence([]);
  }

  private heuristic(orderIndexes: number[]): RouteEvaluation {
    const remaining = new Set(orderIndexes);
    const sequence: number[] = [];
    let current = -1;
    while (remaining.size > 0) {
      let nearest = -1;
      let nearestDistance = Infinity;
      for (const candidate of remaining) {
        const distance =
          current < 0 ? this.matrix.fromDepot(candidate) : this.matrix.betweenOrders(current, candidate);
        if (distance < nearestDistance) {
          nearest = candidate;
          nearestDistance = distance;
        }
      }
      sequence.push(nearest);
      remaining.delete(nearest);
      current = nearest;
    }

    let best = this.evaluateSequence(sequence);
    let improved = true;
    while (improved) {
      improved = false;
      for (let i = 0; i < best.sequence.length - 1; i++) {
        for (let j = i + 1; j < best.sequence.length; j++) {
          const candidate = [
            ...best.sequence.slice(0, i),
            ...best.sequence.slice(i, j + 1).reverse(),
            ...best.sequence.slice(j + 1),
          ];
          const evaluation = this.evaluateSequence(candidate);
          if (evaluation.score < best.score - 1e-9) {
            best = evaluation;
            improved = true;
          }
        }
      }
    }
    return best;
  }

  private static *permutations(items: number[]): Generator<number[]> {
    if (items.length <= 1) {
      yield [...items];
      return;
    }
    for (let i = 0; i < items.length; i++) {
      const rest = [...items.slice(0, i), ...items.slice(i + 1)];
      for (const tail of RouteEvaluator.permutations(rest)) {
        yield [items[i], ...tail];
      }
    }
  }
}
