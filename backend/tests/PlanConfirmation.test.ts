import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PlanService } from "../src/modules/plans/PlanService";
import { PlanRepository } from "../src/modules/plans/PlanRepository";
import { OrderRepository } from "../src/modules/orders/OrderRepository";
import { TransactionRunner } from "../src/database/TransactionRunner";

describe("PlanService confirmation deadline", () => {
  it("rejects a late plan before assigning any orders", async () => {
    const plan = {
      id: 7,
      status: "draft",
      deadlineTime: "12:30",
      summary: { onTime: false, lateStops: 2 },
      routes: [],
    };
    let assignments = 0;
    const plans = {
      withExecutor() {
        return this;
      },
      async findById() {
        return plan;
      },
    } as unknown as PlanRepository;
    const orders = {
      withExecutor() {
        return this;
      },
      async findByIds() {
        return [];
      },
      async assignToPlan() {
        assignments += 1;
        return 0;
      },
    } as unknown as OrderRepository;
    const transactions = {
      async transaction(work: (executor: unknown) => Promise<unknown>) {
        return work({});
      },
    } as unknown as TransactionRunner;
    const service = new PlanService(
      plans,
      orders,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      transactions,
    );

    await assert.rejects(service.confirm(7), (error: { code?: string; status?: number }) => {
      assert.equal(error.code, "PLAN_LATE");
      assert.equal(error.status, 409);
      return true;
    });
    assert.equal(assignments, 0);
  });
});
