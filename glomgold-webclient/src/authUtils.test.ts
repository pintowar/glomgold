import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildLoginRedirect,
  decodeJwtPayload,
  getErrorStatus,
  getReturnToPath,
  isSessionExpired,
  shouldRetryQuery,
} from "./authUtils.ts";

describe("getErrorStatus", () => {
  it("reads axios-shaped errors via response.status", () => {
    assert.equal(getErrorStatus({ response: { status: 401 } }), 401);
  });

  it("reads refine-shaped errors via statusCode", () => {
    assert.equal(getErrorStatus({ statusCode: 401 }), 401);
  });

  it("reads plain status errors", () => {
    assert.equal(getErrorStatus({ status: 403 }), 403);
  });

  it("returns undefined when no usable status exists", () => {
    assert.equal(getErrorStatus({}), undefined);
    assert.equal(getErrorStatus(null), undefined);
    assert.equal(getErrorStatus(undefined), undefined);
    assert.equal(getErrorStatus({ response: { status: "401" } }), undefined);
  });
});

describe("isSessionExpired", () => {
  it("returns false for a token expiring in the future", () => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    assert.equal(isSessionExpired({ exp }), false);
  });

  it("returns true for a token that already expired", () => {
    const exp = Math.floor(Date.now() / 1000) - 3600;
    assert.equal(isSessionExpired({ exp }), true);
  });

  it("returns true when exp is missing or not a number", () => {
    assert.equal(isSessionExpired({}), true);
    assert.equal(isSessionExpired({ exp: "tomorrow" }), true);
    assert.equal(isSessionExpired(null), true);
    assert.equal(isSessionExpired(undefined), true);
  });
});

describe("getReturnToPath", () => {
  it("returns protected panel/admin hash paths", () => {
    assert.equal(getReturnToPath("#/panel/yearly-report"), "/panel/yearly-report");
    assert.equal(getReturnToPath("#/admin/users"), "/admin/users");
  });

  it("strips any query string from the hash", () => {
    assert.equal(getReturnToPath("#/panel?period=2024-01"), "/panel");
  });

  it("rejects login, root, unknown and non-hash locations", () => {
    assert.equal(getReturnToPath("#/login"), undefined);
    assert.equal(getReturnToPath("#/login?to=/panel"), undefined);
    assert.equal(getReturnToPath("#/"), undefined);
    assert.equal(getReturnToPath("#/unknown"), undefined);
    assert.equal(getReturnToPath(""), undefined);
    assert.equal(getReturnToPath("/panel"), undefined);
  });
});

describe("buildLoginRedirect", () => {
  it("embeds the return path for protected locations", () => {
    assert.equal(buildLoginRedirect("#/panel/yearly-report"), "/login?to=%2Fpanel%2Fyearly-report");
  });

  it("falls back to plain /login otherwise", () => {
    assert.equal(buildLoginRedirect("#/login"), "/login");
    assert.equal(buildLoginRedirect(""), "/login");
  });
});

describe("shouldRetryQuery", () => {  it("never retries 401s in any error shape", () => {
    assert.equal(shouldRetryQuery(0, { response: { status: 401 } }), false);
    assert.equal(shouldRetryQuery(0, { statusCode: 401 }), false);
    assert.equal(shouldRetryQuery(2, { response: { status: 401 } }), false);
  });

  it("keeps the default of up to 3 retries for other errors", () => {
    assert.equal(shouldRetryQuery(0, { response: { status: 500 } }), true);
    assert.equal(shouldRetryQuery(2, { response: { status: 500 } }), true);
    assert.equal(shouldRetryQuery(3, { response: { status: 500 } }), false);
    assert.equal(shouldRetryQuery(0, { message: "Network Error" }), true);
  });
});

describe("decodeJwtPayload", () => {
  const toB64Url = (obj: unknown): string =>
    Buffer.from(JSON.stringify(obj), "utf8").toString("base64url");

  it("decodes a standard JWT payload segment", () => {
    const payload = { sub: "donald", exp: 1893456000, roles: ["ROLE_USER"] };
    assert.deepEqual(decodeJwtPayload(`h.${toB64Url(payload)}.s`), payload);
  });

  it("decodes base64url payloads containing - and _ without padding", () => {
    // Bytes 0xfb 0xff 0xfe encode to "-_-" in base64url and are rejected by atob.
    const payload = { sub: "þÿþ", exp: 1893456000 };
    const segment = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    assert.ok(segment.includes("-") || segment.includes("_"));
    assert.deepEqual(decodeJwtPayload(`h.${segment}.s`), payload);
  });

  it("returns undefined for malformed tokens", () => {
    assert.equal(decodeJwtPayload("not-a-token"), undefined);
    assert.equal(decodeJwtPayload("h.!!!.s"), undefined);
    assert.equal(decodeJwtPayload(""), undefined);
  });
});
