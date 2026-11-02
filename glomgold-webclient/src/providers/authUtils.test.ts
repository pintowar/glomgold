import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildLoginRedirect, getErrorStatus, getReturnToPath, shouldRetryQuery } from "./authUtils.ts";

describe("getErrorStatus", () => {
  it("reads fetch-shaped errors via response.status", () => {
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
    assert.equal(getReturnToPath("/panel"), undefined);
  });
});

describe("buildLoginRedirect", () => {
  it("keeps the current page when returnable", () => {
    assert.equal(buildLoginRedirect("#/panel?period=2024-01"), "/login?to=%2Fpanel");
  });

  it("falls back to plain login", () => {
    assert.equal(buildLoginRedirect("#/login"), "/login");
  });
});

describe("shouldRetryQuery", () => {
  it("never retries 401", () => {
    assert.equal(shouldRetryQuery(0, { response: { status: 401 } }), false);
  });

  it("retries other errors three times", () => {
    assert.equal(shouldRetryQuery(0, { statusCode: 500 }), true);
    assert.equal(shouldRetryQuery(2, { statusCode: 500 }), true);
    assert.equal(shouldRetryQuery(3, { statusCode: 500 }), false);
  });
});
