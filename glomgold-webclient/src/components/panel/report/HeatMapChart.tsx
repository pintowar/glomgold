import { useMemo } from "react";
import { useTranslate } from "@refinedev/core";

import { EXPENSE_COLOR, INCOME_COLOR } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";
import type { IMonthlyBalance, IYearlySummary } from "../../../interfaces";

const MONTH_COUNT = 12;
const EPS = 1e-9;
const NEUTRAL_COLOR = "#D9D9D9";
const RED_DARK_TO_LIGHT = ["#A8071A", "#CF1322", EXPENSE_COLOR, "#F78F8B", "#FAC5C3"];
const BLUE_LIGHT_TO_DARK = ["#E6F4FF", "#91CAFF", "#4096FF", INCOME_COLOR, "#003EB3"];

const bucket = (ratio: number) => Math.min(4, Math.max(0, Math.floor(ratio * 5)));

interface HeatMapChartProps {
  years: IYearlySummary[];
  heatmap: IMonthlyBalance[];
  locale: string;
  currency: string;
}

export const HeatMapChart = ({ years, heatmap, locale, currency }: HeatMapChartProps) => {
  const translate = useTranslate();
  const currencyFormat = useCurrencyFormat(locale, currency);

  const yearLabels = useMemo(
    () => (years.length > 0 ? years.map((it) => String(it.year)) : [...new Set(heatmap.map((it) => String(it.year)))].sort()),
    [years, heatmap]
  );

  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
    return Array.from({ length: MONTH_COUNT }, (_, index) => formatter.format(new Date(2000, index, 1)));
  }, [locale]);

  const bounds = useMemo(() => {
    const balances = heatmap.map((it) => Number(it.balance));
    return { min: Math.min(0, ...balances), max: Math.max(0, ...balances) };
  }, [heatmap]);

  const colorFor = (value: number | undefined) => {
    if (value == null || Math.abs(value) < EPS) return NEUTRAL_COLOR;
    if (value < 0) {
      const ratio = bounds.min < -EPS ? value / bounds.min : 1;
      return RED_DARK_TO_LIGHT[bucket(1 - ratio)];
    }
    const ratio = bounds.max > EPS ? value / bounds.max : 1;
    return BLUE_LIGHT_TO_DARK[bucket(ratio)];
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold">{translate("panel.charts.monthlyHeatmap", "Monthly Balance Heatmap")}</p>
      <div className="overflow-x-auto">
        <div
          className="grid gap-1 text-xs"
          style={{ gridTemplateColumns: `80px repeat(${Math.max(yearLabels.length, 1)}, minmax(70px, 1fr))` }}
        >
          <div />
          {yearLabels.map((year) => (
            <div key={year} className="text-center font-semibold">
              {year}
            </div>
          ))}
          {monthLabels.map((month, index) => (
            <div key={month} className="contents">
              <div className="flex items-center">{month}</div>
              {yearLabels.map((year) => {
                const cell = heatmap.find((it) => String(it.year) === year && it.month === index + 1);
                const value = cell ? Number(cell.balance) : undefined;
                return (
                  <div
                    key={`${year}-${month}`}
                    className="rounded-sm py-2 text-center text-white"
                    style={{ backgroundColor: colorFor(value) }}
                    title={value == null ? "" : currencyFormat(value)}
                  >
                    {value == null ? "" : currencyFormat(value)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
