import React, { useCallback, useContext, useMemo } from "react";
import { useTranslate } from "@refinedev/core";
import { ColorModeContext } from "../../../contexts/color-mode";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { EXPENSE_COLOR, INCOME_COLOR } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";
import { IYearlySummary } from "../../../interfaces";

interface YearChartProps {
  years: IYearlySummary[];
  locale: string;
  currency: string;
}

export const YearChart: React.FC<YearChartProps> = ({ years, locale, currency }) => {
  const { mode } = useContext(ColorModeContext);
  const translate = useTranslate();

  const formatCurrency = useCurrencyFormat(locale, currency);
  const currencyFormat = useCallback(
    (value: number | null) => (value == null ? value : formatCurrency(value)),
    [formatCurrency]
  );

  const barChartConfig = useMemo(
    () => ({
      options: {
        title: { text: translate("panel.charts.yearlyEvolution", "Yearly Evolution") },
        chart: { id: "yearly", background: "transparent", animations: { enabled: false } },
        colors: [EXPENSE_COLOR, INCOME_COLOR],
        theme: { mode },
        tooltip: { y: { formatter: currencyFormat } },
        xaxis: { categories: years.map((it) => String(it.year)) },
      } as ApexOptions,
      series: [
        {
          name: translate("panel.charts.series.expense", "expense"),
          data: years.map((it) => it.expense),
        },
        {
          name: translate("panel.charts.series.income", "income"),
          data: years.map((it) => it.income),
        },
      ],
    }),
    [years, currencyFormat, mode, translate]
  );

  return <Chart options={barChartConfig.options} series={barChartConfig.series} type="bar" height={350} width="100%" />;
};
