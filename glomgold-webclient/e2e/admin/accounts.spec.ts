import { expect, test } from "@playwright/test";

import { adminUsers } from "../fixtures";
import { json } from "../support/api";
import { gotoHash, signedIn } from "../support/auth";

const accounts = [
  { id: 1, version: 0, name: "Checking", currency: "USD", type: "CHECKING", userId: 2 },
  { id: 2, version: 0, name: "Credit Card", currency: "USD", type: "CREDIT_CARD", userId: 3 },
];

test.describe("Admin accounts", () => {
  test.beforeEach(async ({ page }) => {
    await signedIn(page, "admin", [
      { method: "GET", path: "/api/accounts", reply: json(accounts) },
      { method: "GET", path: "/api/accounts/1", reply: json(accounts[0]) },
      { method: "GET", path: "/api/users", reply: json(adminUsers) },
    ]);
  });

  test("list renders account rows with user names", async ({ page }) => {
    await gotoHash(page, "/admin/accounts");

    await expect(page.locator("#data-table tbody tr[data-row-id]")).toHaveCount(2);
    await expect(page.locator("#data-table tbody")).toContainText("Checking");
    await expect(page.locator("#data-table tbody")).toContainText("Credit Card");

    await expect(page.locator('[data-row-id="1"]')).toContainText("Scrooge McDuck");
    await expect(page.locator('[data-row-id="2"]')).toContainText("Donald Duck");

    for (const header of ["Name", "Type", "Currency", "User", "Action"]) {
      await expect(page.getByRole("columnheader", { name: header })).toBeVisible();
    }
  });

  test("filters by type and currency", async ({ page }) => {
    await gotoHash(page, "/admin/accounts");

    await expect(page.getByLabel("Type", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Currency", { exact: true })).toBeVisible();

    await page.getByLabel("Type", { exact: true }).click();
    await page.getByRole("option", { name: "Credit Card" }).click();
    await page.getByLabel("Currency", { exact: true }).fill("usd");

    const filteredRequest = page.waitForRequest(
      (request) =>
        request.method() === "GET" &&
        new URL(request.url()).pathname === "/api/accounts" &&
        new URL(request.url()).searchParams.toString().includes("CREDIT_CARD"),
    );
    await page.getByRole("button", { name: "Filter" }).click();

    // simple-rest flattens refine filters into `field=value` query params (`eq` has no suffix).
    const params = new URL((await filteredRequest).url()).searchParams;
    expect(params.get("type")).toBe("CREDIT_CARD");
    expect(params.get("currency")).toBe("USD");
  });

  test("create form renders fields and submits", async ({ page }) => {
    const createRequest = page.waitForRequest(
      (request) => request.method() === "POST" && new URL(request.url()).pathname === "/api/accounts",
    );

    await gotoHash(page, "/admin/accounts/create");

    await expect(page.getByLabel("Name", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Type", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Currency", { exact: true })).toBeVisible();
    await expect(page.getByLabel("User", { exact: true })).toBeVisible();

    await page.getByLabel("Name", { exact: true }).fill("Vacation");
    await page.getByLabel("Currency", { exact: true }).fill("USD");
    await page.getByLabel("User", { exact: true }).click();
    await page.getByRole("option", { name: "Scrooge McDuck" }).click();

    await page.getByRole("button", { name: "Save" }).click();

    expect((await createRequest).postDataJSON()).toMatchObject({
      name: "Vacation",
      currency: "USD",
      type: "CHECKING",
      userId: 2,
    });
  });

  test("edit form loads existing account", async ({ page }) => {
    await gotoHash(page, "/admin/accounts/edit/1");

    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Checking");
    await expect(page.getByLabel("Currency", { exact: true })).toHaveValue("USD");
    await expect(page.getByLabel("User", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });
});
