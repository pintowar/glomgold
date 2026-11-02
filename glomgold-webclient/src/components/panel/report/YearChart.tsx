import { useTranslate } from "@refinedev/core";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { EXPENSE_COLOR, INCOME_COLOR } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";
import type { IYearlySummary } from "../../../interfaces";

interface YearChartProps {
  years: IYearlySummary[];
  locale: string;
  currency: string;
}

export const YearChart = ({ years, locale, currency }: YearChartProps) => {
  const translate = useTranslate();
  const currencyFormat = useCurrencyFormat(locale, currency);

  return (
    <div className="h-[350px] w-full">
      <p className="mb-2 text-sm font-semibold">{translate("panel.charts.yearlyEvolution", "Yearly Evolution")}</p>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={years}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis tickFormatter={(value: number) => currencyFormat(value)} width={90} />
          <Tooltip formatter={(value: number) => currencyFormat(value)} />
          <Legend />
          <Bar dataKey="expense" name={translate("panel.charts.series.expense", "expense")} fill={EXPENSE_COLOR} />
          <Bar dataKey="income" name={translate("panel.charts.series.income", "income")} fill={INCOME_COLOR} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
