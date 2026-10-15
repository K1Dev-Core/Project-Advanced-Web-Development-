import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SettingsSchemas } from "../src/modules/settings/SettingsSchemas";

describe("SettingsSchemas project limits", () => {
  it("rejects rider/order capacities beyond the project brief", () => {
    for (const [key, value] of [
      ["maxOrdersPerRider", 4],
      ["maxBoxesPerOrder", 4],
      ["deliveryWindowMinutes", 61],
    ] as const) {
      assert.equal(SettingsSchemas.update.safeParse({ [key]: value }).success, false, `${key}=${value}`);
    }
  });

  it("accepts the brief limits", () => {
    assert.equal(
      SettingsSchemas.update.safeParse({
        maxOrdersPerRider: 3,
        maxBoxesPerOrder: 3,
        deliveryWindowMinutes: 60,
      }).success,
      true,
    );
  });
});
