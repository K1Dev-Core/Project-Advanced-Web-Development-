import { SeededRandom } from "../../shared/random/SeededRandom";
import { DistanceMatrix } from "./DistanceMatrix";
import { RouteEvaluator } from "./RouteEvaluator";

export type RouteSet = number[][];

interface Move {
  delta: number;
  apply: () => void;
}

export class RouteOptimizer {
  private static readonly EPSILON = 1e-9;
  private static readonly MAX_PASSES = 100;

  constructor(
    private readonly evaluator: RouteEvaluator,
    private readonly matrix: DistanceMatrix,
    private readonly orderCount: number,
    private readonly capacity: number,
  ) {}

  solve(random: SeededRandom, noise: number): RouteSet {
    const routes = this.construct(random, noise);
    this.improve(routes, random);
    return routes.filter((route) => route.length > 0);
  }

  totalScore(routes: RouteSet): number {
    return routes.reduce((total, route) => total + this.evaluator.score(route), 0);
  }

  private construct(random: SeededRandom, noise: number): RouteSet {
    const routes: RouteSet = Array.from({ length: this.orderCount }, (_, index) => [index]);
    const routeOf = Array.from({ length: this.orderCount }, (_, index) => index);
    const savings: { i: number; j: number; value: number }[] = [];

    for (let i = 0; i < this.orderCount; i++) {
      for (let j = i + 1; j < this.orderCount; j++) {
        const base = this.matrix.fromDepot(i) + this.matrix.fromDepot(j) - this.matrix.betweenOrders(i, j);
        const jitter = noise > 0 ? 1 + noise * (random.next() * 2 - 1) : 1;
        savings.push({ i, j, value: base * jitter });
      }
    }
    savings.sort((a, b) => b.value - a.value);

    for (const { i, j } of savings) {
      const a = routeOf[i];
      const b = routeOf[j];
      if (a === b || routes[a].length + routes[b].length > this.capacity) {
        continue;
      }
      const merged = [...routes[a], ...routes[b]];
      const delta = this.evaluator.score(merged) - this.evaluator.score(routes[a]) - this.evaluator.score(routes[b]);
      if (delta < -RouteOptimizer.EPSILON) {
        routes[a] = merged;
        routes[b] = [];
        for (const orderIndex of merged) {
          routeOf[orderIndex] = a;
        }
      }
    }

    return routes.filter((route) => route.length > 0);
  }

  private improve(routes: RouteSet, random: SeededRandom): void {
    for (let pass = 0; pass < RouteOptimizer.MAX_PASSES; pass++) {
      const improvedByRelocate = this.relocatePass(routes, random);
      const improvedBySwap = this.swapPass(routes);
      const improvedByMerge = this.mergePass(routes);
      this.compact(routes);
      if (!improvedByRelocate && !improvedBySwap && !improvedByMerge) {
        return;
      }
    }
  }

  private relocatePass(routes: RouteSet, random: SeededRandom): boolean {
    let improved = false;
    const orders = random.shuffle(Array.from({ length: this.orderCount }, (_, index) => index));

    for (const orderIndex of orders) {
      const from = routes.findIndex((route) => route.includes(orderIndex));
      const source = routes[from];
      const remaining = source.filter((item) => item !== orderIndex);
      const sourceBefore = this.evaluator.score(source);
      const sourceAfter = this.evaluator.score(remaining);

      let best: Move | undefined;
      for (let to = -1; to < routes.length; to++) {
        if (to === from) {
          continue;
        }
        if (to >= 0 && (routes[to].length === 0 || routes[to].length >= this.capacity)) {
          continue;
        }
        if (to < 0 && source.length === 1) {
          continue;
        }
        const target = to < 0 ? [orderIndex] : [...routes[to], orderIndex];
        const targetBefore = to < 0 ? 0 : this.evaluator.score(routes[to]);
        const delta = sourceAfter + this.evaluator.score(target) - sourceBefore - targetBefore;
        if (delta < -RouteOptimizer.EPSILON && (!best || delta < best.delta)) {
          best = {
            delta,
            apply: () => {
              routes[from] = remaining;
              if (to < 0) {
                routes.push(target);
              } else {
                routes[to] = target;
              }
            },
          };
        }
      }

      if (best) {
        best.apply();
        improved = true;
      }
    }

    return improved;
  }

  private swapPass(routes: RouteSet): boolean {
    let improved = false;
    for (let a = 0; a < routes.length; a++) {
      for (let b = a + 1; b < routes.length; b++) {
        let best: Move | undefined;
        const beforeA = this.evaluator.score(routes[a]);
        const beforeB = this.evaluator.score(routes[b]);
        for (const i of routes[a]) {
          for (const j of routes[b]) {
            const nextA = routes[a].map((item) => (item === i ? j : item));
            const nextB = routes[b].map((item) => (item === j ? i : item));
            const delta = this.evaluator.score(nextA) + this.evaluator.score(nextB) - beforeA - beforeB;
            if (delta < -RouteOptimizer.EPSILON && (!best || delta < best.delta)) {
              best = {
                delta,
                apply: () => {
                  routes[a] = nextA;
                  routes[b] = nextB;
                },
              };
            }
          }
        }
        if (best) {
          best.apply();
          improved = true;
        }
      }
    }
    return improved;
  }

  private mergePass(routes: RouteSet): boolean {
    let improved = false;
    for (let a = 0; a < routes.length; a++) {
      for (let b = a + 1; b < routes.length; b++) {
        if (routes[a].length === 0 || routes[b].length === 0) {
          continue;
        }
        if (routes[a].length + routes[b].length > this.capacity) {
          continue;
        }
        const merged = [...routes[a], ...routes[b]];
        const delta =
          this.evaluator.score(merged) - this.evaluator.score(routes[a]) - this.evaluator.score(routes[b]);
        if (delta < -RouteOptimizer.EPSILON) {
          routes[a] = merged;
          routes[b] = [];
          improved = true;
        }
      }
    }
    return improved;
  }

  private compact(routes: RouteSet): void {
    for (let index = routes.length - 1; index >= 0; index--) {
      if (routes[index].length === 0) {
        routes.splice(index, 1);
      }
    }
  }
}
