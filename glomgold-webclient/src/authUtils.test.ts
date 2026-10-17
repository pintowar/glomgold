import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { buildLoginRedirect, getErrorStatus, getReturnToPath, shouldRetryQuery } from "./authUtils.ts";

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

describe("shouldRetryQuery", () => {
  it("never retries 401s in any error shape", () => {
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
