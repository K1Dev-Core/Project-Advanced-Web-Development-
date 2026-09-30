import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GeoMath } from "../src/shared/geo/GeoPoint";
import { SeededRandom } from "../src/shared/random/SeededRandom";
import { DeliveryPlanner } from "../src/modules/planning/DeliveryPlanner";
import { DistanceMatrix } from "../src/modules/planning/DistanceMatrix";
import { ObjectiveFactory } from "../src/modules/planning/objectives/ObjectiveFactory";
import { DeliveryRequest, PlanningParameters } from "../src/modules/planning/PlanningTypes";
import { RouteEvaluator } from "../src/modules/planning/RouteEvaluator";

const depot = { latitude: 16.246825, longitude: 103.252021 };

const params: PlanningParameters = {
  depot,
  boxPrice: 65,
  boxCost: 40,
  riderBaseFee: 15,
  riderFeePerKmPerBox: 2,
  riderSpeedKmh: 30,
  maxOrdersPerRider: 3,
  departureTime: "11:30",
  deliveryWindowMinutes: 60,
  serviceMinutesPerStop: 2,
  roadDistanceFactor: 1.3,
};

function randomRequests(count: number, seed: number): DeliveryRequest[] {
  const random = new SeededRandom(seed);
  return Array.from({ length: count }, (_, index) => ({
    orderId: index + 1,
    customerId: index + 1,
    customerName: `Customer ${index + 1}`,
    phone: "0800000000",
    address: "",
    location: GeoMath.offset(depot, 0.2 + random.next() * 2.8, random.next() * 2 * Math.PI),
    boxes: random.int(1, 3),
  }));
}

function partitions(items: number[], capacity: number): number[][][] {
  if (items.length === 0) {
    return [[]];
  }
  const [first, ...rest] = items;
  const result: number[][][] = [];
  const choose = (pool: number[], size: number): number[][] => {
    if (size === 0) return [[]];
    if (pool.length < size) return [];
    const [head, ...tail] = pool;
    return [...choose(tail, size - 1).map((combo) => [head, ...combo]), ...choose(tail, size)];
  };
  for (let size = 0; size < capacity; size++) {
    for (const companions of choose(rest, size)) {
      const remaining = rest.filter((item) => !companions.includes(item));
      for (const tail of partitions(remaining, capacity)) {
        result.push([[first, ...companions], ...tail]);
      }
    }
  }
  return result;
}

describe("DeliveryPlanner", () => {
  it("assigns every order exactly once and respects rider capacity", () => {
    const requests = randomRequests(28, 11);
    const [proposal] = new DeliveryPlanner().plan(requests, params, { objective: "cost", seed: 5, alternatives: 1 });
    const orderIds = proposal.routes.flatMap((route) => route.stops.map((stop) => stop.orderId)).sort((a, b) => a - b);
    assert.deepEqual(orderIds, requests.map((request) => request.orderId));
    for (const route of proposal.routes) {
      assert.ok(route.orderCount <= params.maxOrdersPerRider);
    }
    assert.equal(proposal.summary.orderCount, requests.length);
    assert.equal(proposal.summary.onTime, true);
  });

  it("is deterministic for the same seed", () => {
    const requests = randomRequests(20, 3);
    const planner = new DeliveryPlanner();
    const a = planner.plan(requests, params, { objective: "cost", seed: 99, alternatives: 3 });
    const b = planner.plan(requests, params, { objective: "cost", seed: 99, alternatives: 3 });
    assert.deepEqual(
      a.map((proposal) => proposal.signature),
      b.map((proposal) => proposal.signature),
    );
  });

  it("finds the optimal cost on small instances", () => {
    for (const seed of [1, 2, 3, 4]) {
      const requests = randomRequests(7, seed);
      const evaluator = new RouteEvaluator(
        new DistanceMatrix(depot, requests.map((request) => request.location), params.roadDistanceFactor),
        requests.map((request) => request.boxes),
        params,
        ObjectiveFactory.create("cost"),
      );
      const optimum = Math.min(
        ...partitions(requests.map((_, index) => index), params.maxOrdersPerRider).map((routes) =>
          routes.reduce((sum, route) => sum + evaluator.score(route), 0),
        ),
      );
      const [proposal] = new DeliveryPlanner().plan(requests, params, { objective: "cost", seed, alternatives: 1 });
      assert.ok(Math.abs(proposal.score - optimum) < 0.02, `seed ${seed}: ${proposal.score} vs optimum ${optimum}`);
    }
  });

  it("returns a different proposal when previous signatures are excluded", () => {
    const requests = randomRequests(15, 8);
    const planner = new DeliveryPlanner();
    const [first] = planner.plan(requests, params, { objective: "cost", seed: 1, alternatives: 1 });
    const [second] = planner.plan(requests, params, {
      objective: "cost",
      seed: 2,
      alternatives: 1,
      excludeSignatures: [first.signature],
    });
    assert.notEqual(second.signature, first.signature);
  });

  it("computes profit consistently with the shop pricing rules", () => {
    const requests = randomRequests(10, 21);
    const [proposal] = new DeliveryPlanner().plan(requests, params, { objective: "cost", seed: 4, alternatives: 1 });
    const boxes = requests.reduce((sum, request) => sum + request.boxes, 0);
    assert.equal(proposal.summary.revenue, boxes * 65);
    assert.equal(proposal.summary.foodCost, boxes * 40);
    for (const route of proposal.routes) {
      const expectedFee = 15 + 2 * route.boxCount * route.distanceKm;
      assert.ok(Math.abs(route.riderFee - expectedFee) < 0.02);
    }
    assert.ok(Math.abs(proposal.summary.netProfit - (boxes * 25 - proposal.summary.totalRiderFee)) < 0.02);
  });
});
