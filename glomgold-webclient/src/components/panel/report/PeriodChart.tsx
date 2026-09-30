import React, { useCallback, useContext, useMemo } from "react";
import { useTranslate } from "@refinedev/core";
import { ColorModeContext } from "../../../contexts/color-mode";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { BALANCE_COLOR, EXPENSE_COLOR } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";

interface PeriodChartProps {
  cols: string[];
  data: number[];
  trend?: number[];
  locale: string;
  currency: string;
}

export const PeriodChart: React.FC<PeriodChartProps> = ({ cols, data, trend, locale, currency }) => {
  const { mode } = useContext(ColorModeContext);
  const translate = useTranslate();

  const formatCurrency = useCurrencyFormat(locale, currency);
  const currencyFormat = useCallback(
    (value: number | null) => (value == null ? value : formatCurrency(value)),
    [formatCurrency]
  );

  const lineChartConfig = useMemo(
    () => ({
      options: {
        title: { text: translate("panel.charts.monthEvolution", "Month Evolution") },
        chart: { id: "line", background: "transparent", animations: { enabled: false } },
        stroke: { dashArray: [0, 8], width: [3, 2] },
        colors: [BALANCE_COLOR, EXPENSE_COLOR],
        theme: { mode },
        tooltip: { y: { formatter: currencyFormat } },
        xaxis: { categories: cols },
      } as ApexOptions,
      series: [
        {
          name: translate("panel.charts.series.value", "value"),
          data: data.map((it) => (it !== 0 ? it : null)),
        },
        {
          name: translate("panel.charts.series.trend", "trend"),
          data: (trend ?? []).map((it) => (it !== 0 ? it : null)),
        },
      ],
    }),
    [cols, data, trend, currencyFormat, mode, translate]
  );

  return (
    <Chart options={lineChartConfig.options} series={lineChartConfig.series} type="line" height={350} width="100%" />
  );
};
