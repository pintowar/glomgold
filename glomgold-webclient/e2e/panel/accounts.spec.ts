import { expect, test } from "playwright-test-coverage";

import { json } from "../support/api";
import { gotoHash, signedIn } from "../support/auth";

const accounts = [
  { id: 1, version: 0, name: "Conta Corrente", currency: "BRL", type: "CHECKING", userId: 3 },
  { id: 2, version: 0, name: "Cartão de Crédito", currency: "BRL", type: "CREDIT_CARD", userId: 3 },
];

test.describe("Panel accounts", () => {
  test.beforeEach(async ({ page }) => {
    await signedIn(page, "common", [
      { method: "GET", path: "/api/panel/accounts", reply: json(accounts) },
      { method: "POST", path: "/api/panel/accounts", reply: json({ id: 3 }) },
      { method: "DELETE", path: "/api/panel/accounts/1", reply: json({}) },
    ]);

    await gotoHash(page, "/panel/accounts");
  });

  test("lists the user accounts", async ({ page }) => {
    const rows = page.locator('[data-cy="accounts-panel"] tbody tr');

    await expect(rows).toHaveCount(2);
    await expect(rows).toContainText(["Conta Corrente", "Cartão de Crédito"]);
  });

  test("creates an account", async ({ page }) => {
    await page.locator('[data-cy="new-account"]').click();
    await page.locator('[data-cy="account-name"]').fill("Poupança");

    const createRequest = page.waitForRequest(
      (request) => request.method() === "POST" && new URL(request.url()).pathname === "/api/panel/accounts",
    );
    await page.getByRole("dialog").getByRole("button", { name: "Salvar" }).click();

    expect((await createRequest).postDataJSON()).toEqual({
      name: "Poupança",
      currency: "",
      type: "CHECKING",
    });
  });

  test("removes an account", async ({ page }) => {
    await page
      .locator('[data-cy="accounts-panel"] tbody tr')
      .filter({ hasText: "Conta Corrente" })
      .locator('[data-cy="remove-account"]')
      .click();

    const deleteRequest = page.waitForRequest(
      (request) => request.method() === "DELETE" && new URL(request.url()).pathname === "/api/panel/accounts/1",
    );
    await page.getByRole("alertdialog").getByRole("button", { name: "Continue" }).click();

    await deleteRequest;
  });
});
