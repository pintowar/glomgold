import { expect, test } from "@playwright/test";

import { adminUsers } from "../fixtures";
import { json } from "../support/api";
import { gotoHash, signedIn } from "../support/auth";

const items = [
  {
    id: 1,
    version: 0,
    description: "Gym",
    value: 100,
    itemType: "EXPENSE",
    currency: "USD",
    year: 2023,
    month: 9,
    userId: 2,
    accountId: 1,
  },
  {
    id: 2,
    version: 0,
    description: "Salary",
    value: 11000,
    itemType: "INCOME",
    currency: "USD",
    year: 2023,
    month: 9,
    userId: 3,
    accountId: 2,
  },
];

const accounts = [
  { id: 1, version: 0, name: "Checking", currency: "USD", type: "CHECKING", userId: 2 },
  { id: 2, version: 0, name: "Credit Card", currency: "USD", type: "CREDIT_CARD", userId: 3 },
];

test.describe("Admin items", () => {
  test.beforeEach(async ({ page }) => {
    await signedIn(page, "admin", [
      { method: "GET", path: "/api/items", reply: json(items) },
      { method: "GET", path: "/api/items/1", reply: json(items[0]) },
      { method: "GET", path: "/api/accounts", reply: json(accounts) },
      { method: "GET", path: "/api/users", reply: json(adminUsers) },
    ]);
  });

  test("list renders items with user and account names", async ({ page }) => {
    await gotoHash(page, "/admin/items");

    await expect(page.locator("#data-table tbody tr[data-row-id]")).toHaveCount(2);
    await expect(page.locator("#data-table tbody")).toContainText("Gym");
    await expect(page.locator("#data-table tbody")).toContainText("Salary");

    // User/account columns resolve ids through lookup maps, never raw ids.
    await expect(page.locator('[data-row-id="1"]')).toContainText("Scrooge McDuck");
    await expect(page.locator('[data-row-id="2"]')).toContainText("Donald Duck");
    await expect(page.locator('[data-row-id="1"]')).toContainText("Checking");
    await expect(page.locator('[data-row-id="2"]')).toContainText("Credit Card");

    await expect(page.getByRole("columnheader", { name: "Description" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "User" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Account" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Action" })).toBeVisible();
  });

  test("edit form loads item with user and account selects", async ({ page }) => {
    await gotoHash(page, "/admin/items/edit/1");

    await expect(page.getByLabel("Description", { exact: true })).toHaveValue("Gym");
    await expect(page.getByLabel("Value", { exact: true })).toHaveValue("100");

    await expect(page.getByLabel("Type", { exact: true })).toBeVisible();
    await expect(page.getByLabel("User", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Account", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Save" })).toBeVisible();
  });
});
