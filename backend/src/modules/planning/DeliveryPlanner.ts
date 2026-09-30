import { SeededRandom } from "../../shared/random/SeededRandom";
import { DistanceMatrix } from "./DistanceMatrix";
import { ObjectiveFactory } from "./objectives/ObjectiveFactory";
import { PlanBuilder } from "./PlanBuilder";
import { DeliveryRequest, PlanningOptions, PlanningParameters, PlanProposal } from "./PlanningTypes";
import { RouteEvaluator } from "./RouteEvaluator";
import { RouteOptimizer, RouteSet } from "./RouteOptimizer";

interface Candidate {
  routes: RouteSet;
  score: number;
  signature: string;
}

export class DeliveryPlanner {
  private static readonly MIN_RESTARTS = 12;
  private static readonly MAX_RESTARTS = 80;
  private static readonly WORK_BUDGET = 2400;

  plan(requests: DeliveryRequest[], params: PlanningParameters, options: PlanningOptions): PlanProposal[] {
    if (requests.length === 0) {
      return [];
    }

    const objective = ObjectiveFactory.create(options.objective);
    const matrix = new DistanceMatrix(
      params.depot,
      requests.map((request) => request.location),
      params.roadDistanceFactor,
    );
    const evaluator = new RouteEvaluator(
      matrix,
      requests.map((request) => request.boxes),
      params,
      objective,
    );
    const optimizer = new RouteOptimizer(evaluator, matrix, requests.length, params.maxOrdersPerRider);
    const random = new SeededRandom(options.seed);
    const restarts = Math.min(
      DeliveryPlanner.MAX_RESTARTS,
      Math.max(DeliveryPlanner.MIN_RESTARTS, Math.round(DeliveryPlanner.WORK_BUDGET / requests.length)),
    );

    const candidates = new Map<string, Candidate>();
    for (let attempt = 0; attempt < restarts; attempt++) {
      const noise = attempt === 0 ? 0 : 0.15 + random.next() * 0.6;
      const routes = optimizer.solve(random, noise);
      const signature = PlanBuilder.signature(routes.map((route) => route.map((index) => requests[index].orderId)));
      if (!candidates.has(signature)) {
        candidates.set(signature, { routes, score: optimizer.totalScore(routes), signature });
      }
    }

    const excluded = new Set(options.excludeSignatures ?? []);
    const ranked = [...candidates.values()].sort((a, b) => a.score - b.score);
    const fresh = ranked.filter((candidate) => !excluded.has(candidate.signature));
    const chosen = (fresh.length > 0 ? fresh : ranked).slice(0, Math.max(1, options.alternatives));

    const builder = new PlanBuilder(requests, params);
    return chosen.map((candidate) =>
      builder.build(
        candidate.routes.map((route) => evaluator.best(route)),
        options.objective,
        options.seed,
        candidate.score,
      ),
    );
  }
}
