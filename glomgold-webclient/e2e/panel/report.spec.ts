import { expect, test } from "playwright-test-coverage";

import { panelAccounts, panelReport } from "../fixtures";
import { json } from "../support/api";
import { gotoHash, signedIn } from "../support/auth";

test.describe("Panel yearly report", () => {
  test.beforeEach(async ({ page }) => {
    await signedIn(page, "common", [
      { method: "GET", path: "/api/panel/accounts", reply: json(panelAccounts) },
      { method: "GET", path: "/api/panel/yearly-report", reply: json(panelReport) },
    ]);

    await gotoHash(page, "/panel/yearly-report?period=2023");
  });

  test("renders the summary table with income/expense colors and both charts", async ({ page }) => {
    const valueLinks = page.locator("table a");
    await expect(valueLinks.first()).toBeVisible();

    // Values are painted with the income (blue) / expense (red) palette.
    const colors = await valueLinks.evaluateAll((links) => links.map((link) => getComputedStyle(link).color));
    expect(colors).toContain("rgb(245, 34, 45)");
    expect(colors).toContain("rgb(22, 119, 255)");

    await page.getByRole("tab", { name: "Gráfico" }).click();

    const charts = page.locator(".recharts-responsive-container");
    await expect(charts).toHaveCount(2);
    await expect(charts.first()).toBeVisible();
    await expect(charts.last()).toBeVisible();
  });
});
