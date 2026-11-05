import { useMemo } from "react";
import { useTranslate } from "@refinedev/core";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { BALANCE_COLOR, CHART_TOOLTIP_PROPS, EXPENSE_COLOR } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";

interface PeriodChartProps {
  cols: string[];
  data: number[];
  trend?: number[];
  locale: string;
  currency: string;
}

export const PeriodChart = ({ cols, data, trend, locale, currency }: PeriodChartProps) => {
  const translate = useTranslate();
  const currencyFormat = useCurrencyFormat(locale, currency);

  const chartData = useMemo(
    () =>
      cols.map((col, index) => ({
        col,
        value: data[index] !== 0 ? data[index] : null,
        trend: trend?.[index] ? trend[index] : null,
      })),
    [cols, data, trend]
  );

  return (
    <div className="h-[350px] w-full">
      <p className="mb-2 text-sm font-semibold">{translate("panel.charts.monthEvolution", "Month Evolution")}</p>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="col" />
          <YAxis tickFormatter={(value: number) => currencyFormat(value)} width={90} />
          <Tooltip {...CHART_TOOLTIP_PROPS} formatter={(value: number) => currencyFormat(value)} />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            name={translate("panel.charts.series.value", "value")}
            stroke={BALANCE_COLOR}
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="trend"
            name={translate("panel.charts.series.trend", "trend")}
            stroke={EXPENSE_COLOR}
            strokeWidth={2}
            strokeDasharray="8 4"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
