import { expect, test, type Page } from "playwright-test-coverage";

import { panelAccounts, panelControl, panelControlEmpty, panelItemComplete } from "../fixtures";
import { json, type ApiRoute } from "../support/api";
import { gotoHash, signedIn } from "../support/auth";

const PERIOD = "2023-09";
const PREVIOUS = "2023-08";

const panelRoutes = (overrides: ApiRoute[] = []): ApiRoute[] => [
  ...overrides,
  { method: "GET", path: "/api/panel/accounts", reply: json(panelAccounts) },
  {
    method: "GET",
    path: "/api/panel",
    reply: (route) => {
      const period = new URL(route.request().url()).searchParams.get("period");
      return route.fulfill({ status: 200, json: period === PREVIOUS ? panelControlEmpty : panelControl });
    },
  },
  { method: "GET", path: "/api/panel/item-complete", reply: json(panelItemComplete) },
];

const openPanel = async (page: Page, overrides: ApiRoute[] = []) => {
  await signedIn(page, "common", panelRoutes(overrides));
  await gotoHash(page, `/panel?period=${PERIOD}`);
  await expect(page.getByTestId("period-summary-card")).toBeVisible();
};

const panelRequest = (page: Page, period?: string) =>
  page.waitForRequest((request) => {
    const url = new URL(request.url());
    if (url.pathname !== "/api/panel") return false;
    return period ? url.searchParams.get("period") === period : true;
  });

const row = (page: Page, key: number) => page.locator(`[data-item-key="${key}"]`);

test.describe("Panel control", () => {
  test("period navigation requests the previous period and back", async ({ page }) => {
    await openPanel(page);

    const previous = panelRequest(page, PREVIOUS);
    await page.getByTestId("navigate-left").click();
    await previous;
    await expect(page).toHaveURL(new RegExp(`period=${PREVIOUS}`));

    const current = panelRequest(page, PERIOD);
    await page.getByTestId("navigate-right").click();
    await current;
    await expect(page).toHaveURL(new RegExp(`period=${PERIOD}`));
  });

  test("account filter defaults to the first account and switches", async ({ page }) => {
    await openPanel(page);

    const filter = page.getByTestId("account-filter");
    await expect(filter).toContainText("Conta Corrente");

    const creditCard = page.waitForRequest(
      (request) =>
        new URL(request.url()).pathname === "/api/panel" &&
        new URL(request.url()).searchParams.get("accountId") === "2",
    );
    await filter.click();
    await page.getByRole("option", { name: "Cartão de Crédito" }).click();

    await creditCard;
    await expect(page).toHaveURL(/account=2/);
  });

  test("period summary shows totals and differences per tab", async ({ page }) => {
    await openPanel(page);

    const card = page.getByTestId("period-summary-card");

    await card.getByRole("tab", { name: "Saldo" }).click();
    await expect(card.getByTestId("monthly-value")).toContainText("500,00");
    await expect(card.getByTestId("monthly-diff")).toContainText("-87,78");

    await card.getByRole("tab", { name: "Despesa" }).click();
    await expect(card.getByTestId("monthly-value")).toContainText("10.500,00");
    await expect(card.getByTestId("monthly-diff")).toContainText("32,70");

    await card.getByRole("tab", { name: "Receita" }).click();
    await expect(card.getByTestId("monthly-value")).toContainText("11.000,00");
    await expect(card.getByTestId("monthly-diff")).toContainText("-8,33");

    const previous = panelRequest(page, PREVIOUS);
    await page.getByTestId("navigate-left").click();
    await previous;

    await card.getByRole("tab", { name: "Saldo" }).click();
    await expect(card.getByTestId("monthly-value")).toContainText("0,00");
    await expect(card.getByTestId("monthly-diff")).toContainText("0,00");
  });

  test.describe("month items", () => {
    test("adds an item for the current account and period", async ({ page }) => {
      await openPanel(page);
      await expect(page.getByTestId("add-item")).toBeEnabled();

      const autocomplete = page.waitForRequest(
        (request) => new URL(request.url()).pathname === "/api/panel/item-complete",
      );
      await page.getByTestId("add-item-description").fill("Gym");
      await autocomplete;
      await page.getByTestId("add-item-value").fill("45");

      const addRequest = page.waitForRequest(
        (request) => request.method() === "POST" && new URL(request.url()).pathname === "/api/panel/add-item",
      );
      await page.getByTestId("add-item").click();

      expect((await addRequest).postDataJSON()).toEqual({
        period: PERIOD,
        description: "Gym",
        value: 45,
        itemType: "EXPENSE",
        accountId: 1,
        categoryId: null,
      });
    });

    test("edits an item inline", async ({ page }) => {
      await openPanel(page);

      const item = row(page, 57);
      await item.getByTestId("item-edit").click();
      await item.locator("input").nth(0).fill("Workout");
      await item.locator("input").nth(1).fill("150");

      const editRequest = page.waitForRequest(
        (request) =>
          request.method() === "PATCH" && new URL(request.url()).pathname === "/api/panel/edit-item/57",
      );
      await item.getByTestId("item-confirm").click();

      expect((await editRequest).postDataJSON()).toMatchObject({
        period: PERIOD,
        description: "Workout",
        value: 150,
      });
    });

    test("deletes a single item", async ({ page }) => {
      await openPanel(page);

      await row(page, 57).getByTestId("item-delete").click();

      const deleteRequest = page.waitForRequest(
        (request) =>
          request.method() === "DELETE" && new URL(request.url()).pathname === "/api/panel/remove-item/57",
      );
      await page.getByRole("alertdialog").getByRole("button", { name: "Continue" }).click();

      await deleteRequest;
    });

    test("deletes the selected items", async ({ page }) => {
      await openPanel(page);

      await row(page, 57).getByRole("checkbox").check();
      await row(page, 58).getByRole("checkbox").check();

      const deleteRequest = page.waitForRequest(
        (request) =>
          request.method() === "DELETE" &&
          new URL(request.url()).pathname === `/api/panel/remove-items/${PERIOD}`,
      );
      await page.getByTestId("delete-selected").click();
      await page.getByRole("alertdialog").getByRole("button", { name: "Continue" }).click();

      expect(new URL((await deleteRequest).url()).searchParams.get("ids")).toBe("57,58");
    });

    test("replicates the selected items to the next month", async ({ page }) => {
      await openPanel(page);

      await row(page, 57).getByRole("checkbox").check();
      await row(page, 58).getByRole("checkbox").check();

      const copyRequest = page.waitForRequest(
        (request) => request.method() === "POST" && new URL(request.url()).pathname === "/api/panel/copy-items",
      );
      await page.getByTestId("replicate-month").click();

      expect((await copyRequest).postDataJSON()).toEqual([
        {
          period: PERIOD,
          description: "Gym",
          itemType: "EXPENSE",
          value: 100,
          accountId: 1,
          categoryId: null,
        },
        {
          period: PERIOD,
          description: "Condominium",
          itemType: "EXPENSE",
          value: 4000,
          accountId: 1,
          categoryId: null,
        },
      ]);
    });
  });
});
