import React, { useContext } from "react";
import { ColorModeContext } from "../../../contexts/color-mode";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { BALANCE_COLOR, EXPENSE_COLOR } from "../../../constants";

interface PeriodChartProps {
  cols: string[];
  data: number[];
  trend?: number[];
  locale: string;
  currency: string;
}

export const PeriodChart: React.FC<PeriodChartProps> = ({ cols, data, trend, locale, currency }) => {
  const { mode } = useContext(ColorModeContext);

  const currencyFormat = (value: number | null) => value?.toLocaleString(locale, { style: "currency", currency });

  const lineChartConfig = {
    options: {
      title: { text: "Month Evolution" },
      chart: { id: "line", background: "transparent", animations: { enabled: false } },
      stroke: { dashArray: [0, 8], width: [3, 2] },
      colors: [BALANCE_COLOR, EXPENSE_COLOR],
      theme: { mode },
      tooltip: { y: { formatter: currencyFormat } },
      xaxis: { categories: cols },
    } as ApexOptions,
    series: [
      { name: "value", data: data.map((it) => (it !== 0 ? it : null)) },
      { name: "trend", data: (trend ?? []).map((it) => (it !== 0 ? it : null)) },
    ],
  };

  return (
    <Chart options={lineChartConfig.options} series={lineChartConfig.series} type="line" height={350} width="100%" />
  );
};
