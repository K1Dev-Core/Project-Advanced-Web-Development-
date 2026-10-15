import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TrackingService } from "../src/modules/tracking/TrackingService";
import { Order } from "../src/modules/orders/Order";
import { SqlExecutor } from "../src/database/SqlExecutor";
import { ShopSettings } from "../src/modules/settings/ShopSettings";
const location = { latitude: 16.246825, longitude: 103.252021 };
const order: Order = {
  id: 7,
  trackingCode: "a".repeat(48),
  customerId: 9,
  customer: {
    id: 9,
    fullName: "พิมพ์ชนก ใจดี",
    phone: "0899999999",
    address: "Private address",
    location,
  },
  deliveryDate: "2026-10-15",
  boxes: 2,
  unitPrice: 65,
  totalPrice: 130,
  status: "assigned",
  note: "Private note",
  simulated: false,
  planId: 3,
  deliveredAt: null,
  createdAt: null,
  updatedAt: "2026-10-15T09:00:00Z",
};
const settings = {
  shopName: "ร้านส่งสุข",
  shopLocation: location,
} as ShopSettings;
function subject(value: Order | null = order) {
  let queries = 0,
    lookups = 0;
  const database = {
    async query<T>() {
      queries++;
      return [
        {
          eta: "11:42",
          late: 0,
          departure_time: "11:30",
          deadline_time: "12:30",
          route_status: "in_progress",
          rider_name: "ต้น",
        },
      ] as T[];
    },
    async execute() {
      throw new Error("Tracking must not mutate data");
    },
  } satisfies SqlExecutor;
  return {
    service: new TrackingService(
      database,
      {
        async findByTrackingCode(code) {
          lookups++;
          assert.equal(code, "a".repeat(48));
          return value;
        },
      },
      {
        async get() {
          return settings;
        },
      },
    ),
    counts: () => ({ queries, lookups }),
  };
}
describe("TrackingService", () => {
  it("rejects IDs and malformed tokens before querying customer data", async () => {
    const { service, counts } = subject();
    for (const token of ["7", "DEMO01", "a".repeat(47), "z".repeat(48)])
      await assert.rejects(() => service.get(token), {
        status: 404,
        code: "TRACKING_NOT_FOUND",
      });
    assert.deepEqual(counts(), { queries: 0, lookups: 0 });
  });
  it("returns the same not-found response for an unknown capability", async () => {
    const { service } = subject(null);
    await assert.rejects(() => service.get("a".repeat(48)), {
      status: 404,
      code: "TRACKING_NOT_FOUND",
    });
  });
  it("only exposes the order-scoped snapshot and scheduled arrival", async () => {
    const { service } = subject();
    const snapshot = await service.get("a".repeat(48));
    assert.equal(snapshot.reference, "SS7");
    assert.equal(snapshot.recipient.displayName, "คุณพิมพ์ชนก");
    assert.equal(snapshot.schedule.eta, "11:42");
    assert.equal(snapshot.routeStatus, "in_progress");
    const serialized = JSON.stringify(snapshot);
    for (const secret of [
      "0899999999",
      "Private address",
      "Private note",
      "jobCode",
      "trackingCode",
      "customerId",
    ])
      assert.equal(serialized.includes(secret), false);
  });
  it("does not retrieve other routes for an unassigned order", async () => {
    const { service, counts } = subject({
      ...order,
      status: "pending",
      planId: null,
    });
    const snapshot = await service.get("a".repeat(48));
    assert.equal(snapshot.schedule.eta, null);
    assert.equal(snapshot.riderName, null);
    assert.equal(counts().queries, 0);
  });
});
