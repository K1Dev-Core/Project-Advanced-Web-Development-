import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AuthService } from "../src/modules/auth/AuthService";

const config = {
  enabled: true,
  ownerUsername: "owner",
  ownerPassword: "secret-pass",
  jwtSecret: "a-very-long-test-secret-value",
  tokenTtlHours: 1,
};

describe("AuthService", () => {
  it("issues a token that verifies back to the owner", () => {
    const service = new AuthService(config);
    const result = service.login("owner", "secret-pass");
    assert.equal(result.tokenType, "Bearer");
    assert.deepEqual(service.verify(result.token), { username: "owner", role: "owner" });
  });

  it("rejects wrong credentials", () => {
    const service = new AuthService(config);
    assert.throws(() => service.login("owner", "wrong"), { code: "INVALID_CREDENTIALS" });
    assert.throws(() => service.login("someone", "secret-pass"), { code: "INVALID_CREDENTIALS" });
  });

  it("rejects tokens signed with another secret", () => {
    const token = new AuthService({ ...config, jwtSecret: "another-secret-value-123" }).login("owner", "secret-pass").token;
    assert.throws(() => new AuthService(config).verify(token), { code: "INVALID_TOKEN" });
  });

  it("reports missing configuration", () => {
    const service = new AuthService({ ...config, ownerPassword: undefined });
    assert.throws(() => service.login("owner", "x"), { code: "AUTH_NOT_CONFIGURED" });
  });
});
