import { useMemo } from "react";
import { useTranslate } from "@refinedev/core";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { CHART_TOOLTIP_PROPS, EXPENSE_COLOR, INCOME_COLOR } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";

interface ItemChartProps {
  cols: string[];
  data: number[];
  locale: string;
  currency: string;
}

export const ItemChart = ({ cols, data, locale, currency }: ItemChartProps) => {
  const translate = useTranslate();
  const currencyFormat = useCurrencyFormat(locale, currency);

  const chartData = useMemo(
    () =>
      cols.map((col, index) => {
        const value = data[index];
        return {
          col,
          EXPENSE: value < 0 ? value : null,
          INCOME: value > 0 ? value : null,
        };
      }),
    [cols, data]
  );

  return (
    <div className="h-[350px] w-full">
      <p className="mb-2 text-sm font-semibold">{translate("panel.charts.averageItemCost", "Average Item Cost")}</p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="col" />
          <YAxis tickFormatter={(value: number) => currencyFormat(value)} width={90} />
          <Tooltip {...CHART_TOOLTIP_PROPS} formatter={(value: number) => currencyFormat(value)} />
          <Legend />
          <Bar dataKey="EXPENSE" name={translate("panel.charts.series.expense", "expense")} stackId="a" fill={EXPENSE_COLOR} />
          <Bar dataKey="INCOME" name={translate("panel.charts.series.income", "income")} stackId="a" fill={INCOME_COLOR} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
