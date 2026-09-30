import React, { useCallback, useContext, useMemo } from "react";
import { useTranslate } from "@refinedev/core";
import { ColorModeContext } from "../../../contexts/color-mode";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { EXPENSE_COLOR, INCOME_COLOR } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";
import { IMonthlyBalance, IYearlySummary } from "../../../interfaces";

const MONTH_COUNT = 12;

/** Short month names in the user's locale (e.g. Jan/Feb… or jan./fev.…). */
const useMonthLabels = (locale: string): string[] =>
  useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { month: "short" });
    return Array.from({ length: MONTH_COUNT }, (_, i) => formatter.format(new Date(2000, i, 1)));
  }, [locale]);

const STEPS = 5;
const EPS = 1e-9;
const NEUTRAL_COLOR = "#D9D9D9";
const RED_DARK_TO_LIGHT = ["#A8071A", "#CF1322", EXPENSE_COLOR, "#F78F8B", "#FAC5C3"];
const BLUE_LIGHT_TO_DARK = ["#E6F4FF", "#91CAFF", "#4096FF", INCOME_COLOR, "#003EB3"];

interface HeatMapColorRange {
  from: number;
  to: number;
  color: string;
}

const buildColorRanges = (heatmap: IMonthlyBalance[]): HeatMapColorRange[] => {
  const balances = heatmap.map((it) => Number(it.balance));
  const min = Math.min(0, ...balances);
  const max = Math.max(0, ...balances);
  const ranges: HeatMapColorRange[] = [{ from: -EPS, to: EPS, color: NEUTRAL_COLOR }];

  if (min < -EPS) {
    for (let i = 0; i < STEPS; i++) {
      const from = (min * (STEPS - i)) / STEPS;
      const to = (min * (STEPS - i - 1)) / STEPS;
      ranges.push({ from, to: i === STEPS - 1 ? -EPS : to, color: RED_DARK_TO_LIGHT[i] });
    }
  }

  if (max > EPS) {
    for (let i = 0; i < STEPS; i++) {
      const from = (max * i) / STEPS;
      const to = (max * (i + 1)) / STEPS;
      ranges.push({ from: i === 0 ? EPS : from, to, color: BLUE_LIGHT_TO_DARK[i] });
    }
  }

  if (ranges.length === 1) {
    ranges.push({ from: -Number.MAX_VALUE, to: Number.MAX_VALUE, color: NEUTRAL_COLOR });
  }

  return ranges;
};

interface HeatMapChartProps {
  years: IYearlySummary[];
  heatmap: IMonthlyBalance[];
  locale: string;
  currency: string;
}

export const HeatMapChart: React.FC<HeatMapChartProps> = ({ years, heatmap, locale, currency }) => {
  const { mode } = useContext(ColorModeContext);
  const translate = useTranslate();
  const monthLabels = useMonthLabels(locale);

  const formatCurrency = useCurrencyFormat(locale, currency);
  const currencyFormat = useCallback(
    (value: number | null) => (value == null ? value : formatCurrency(value)),
    [formatCurrency]
  );

  const yearLabels = useMemo(() => years.map((it) => String(it.year)), [years]);

  const heatMapConfig = useMemo(() => {
    const series = [...monthLabels].reverse().map((label, idx) => {
      const month = monthLabels.length - idx;
      return {
        name: label,
        data: yearLabels.map((year) => {
          const cell = heatmap.find((it) => String(it.year) === year && it.month === month);
          return { x: year, y: cell ? Number(cell.balance) : null };
        }),
      };
    });

    return {
      options: {
        title: { text: translate("panel.charts.monthlyHeatmap", "Monthly Balance Heatmap") },
        chart: { id: "heatmap", background: "transparent", animations: { enabled: false }, type: "heatmap" },
        colors: [EXPENSE_COLOR],
        theme: { mode },
        legend: { show: false },
        dataLabels: { enabled: false },
        tooltip: { y: { formatter: currencyFormat } },
        xaxis: { categories: yearLabels },
        plotOptions: {
          heatmap: {
            radius: 0,
            enableShades: false,
            colorScale: {
              ranges: buildColorRanges(heatmap),
            },
          },
        },
      } as ApexOptions,
      series,
    };
  }, [years, heatmap, yearLabels, currencyFormat, mode, monthLabels, translate]);

  return (
    <Chart
      options={heatMapConfig.options}
      series={heatMapConfig.series}
      type="heatmap"
      height={350 + monthLabels.length * 8}
      width="100%"
    />
  );
};
