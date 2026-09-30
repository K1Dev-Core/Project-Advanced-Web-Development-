import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FetchLike, OsrmRoutingProvider } from "../src/modules/routing/OsrmRoutingProvider";
import { RoutingService } from "../src/modules/routing/RoutingService";

const points = [
  { latitude: 16.246825, longitude: 103.252021 },
  { latitude: 16.25, longitude: 103.26 },
  { latitude: 16.24, longitude: 103.245 },
];

function fakeFetch(handler: (url: string) => unknown, status = 200): FetchLike & { calls: string[] } {
  const calls: string[] = [];
  const fn = (async (url: string) => {
    calls.push(url);
    return { ok: status === 200, status, json: async () => handler(url) };
  }) as FetchLike & { calls: string[] };
  fn.calls = calls;
  return fn;
}

describe("OsrmRoutingProvider", () => {
  it("converts the OSRM table into kilometers using lng,lat order", async () => {
    const fetcher = fakeFetch(() => ({
      code: "Ok",
      distances: [
        [0, 1500, 2500],
        [1600, 0, 3000],
        [2400, 3100, 0],
      ],
    }));
    const provider = new OsrmRoutingProvider("https://osrm.test", "driving", 1000, fetcher);
    const table = await provider.table(points);
    assert.equal(table.source, "road");
    assert.deepEqual(table.distancesKm[0], [0, 1.5, 2.5]);
    assert.equal(table.distancesKm[1][0], 1.6);
    assert.match(fetcher.calls[0], /\/table\/v1\/driving\/103\.252021,16\.246825;103\.260000,16\.250000;/);
  });

  it("returns the road geometry as latitude/longitude points", async () => {
    const fetcher = fakeFetch(() => ({
      code: "Ok",
      routes: [{ distance: 4200, geometry: { coordinates: [[103.25, 16.24], [103.26, 16.25]] } }],
    }));
    const provider = new OsrmRoutingProvider("https://osrm.test", "driving", 1000, fetcher);
    const path = await provider.path(points);
    assert.equal(path.distanceKm, 4.2);
    assert.deepEqual(path.geometry[0], { latitude: 16.24, longitude: 103.25 });
  });

  it("rejects tables with unroutable cells", async () => {
    const fetcher = fakeFetch(() => ({ code: "Ok", distances: [[0, null, 1], [1, 0, 1], [1, 1, 0]] }));
    const provider = new OsrmRoutingProvider("https://osrm.test", "driving", 1000, fetcher);
    await assert.rejects(provider.table(points));
  });
});

describe("RoutingService", () => {
  it("falls back to estimated distances when the provider fails", async () => {
    const fetcher = fakeFetch(() => ({ code: "Error" }), 500);
    const service = new RoutingService(new OsrmRoutingProvider("https://osrm.test", "driving", 1000, fetcher), 2);
    const table = await service.table(points, 1.3);
    assert.equal(table.source, "estimated");
    assert.equal(table.distancesKm.length, 3);
    const [path] = await service.paths([points], 1.3);
    assert.equal(path.source, "estimated");
    assert.deepEqual(path.geometry, points);
  });

  it("uses estimated distances when no provider is configured", async () => {
    const table = await new RoutingService(null, 2).table(points, 1);
    assert.equal(table.source, "estimated");
    assert.ok(table.distancesKm[0][1] > 0.9 && table.distancesKm[0][1] < 1.0);
  });
});
