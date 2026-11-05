import { useMemo } from "react";
import { useTranslate } from "@refinedev/core";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { CHART_TOOLTIP_PROPS, EXPENSE_COLOR, INCOME_COLOR, ITEM_TYPES } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";
import type { IItem } from "../../../interfaces";

export const MonthStatsCard = ({
  tableData,
  locale,
  currency,
}: {
  tableData: IItem[];
  locale: string;
  currency: string;
}) => {
  const translate = useTranslate();
  const currencyFormat = useCurrencyFormat(locale, currency);

  const data = useMemo(() => {
    const grouped = new Map<string, IItem[]>();
    tableData.forEach((item) => {
      grouped.set(item.description, [...(grouped.get(item.description) ?? []), item]);
    });

    return Array.from(grouped.entries()).map(([description, items]) => ({
      description,
      ...Object.fromEntries(
        ITEM_TYPES.map((type) => [
          type,
          items.filter((item) => item.itemType === type).reduce((sum, item) => sum + item.value, 0),
        ])
      ),
    }));
  }, [tableData]);

  return (
    <Card className="h-full w-full">
      <CardHeader>
        <CardTitle className="text-base">{translate("panel.monthStats.title", "Month Stats")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" barSize={18}>
              <XAxis type="number" tickFormatter={(value: number) => currencyFormat(value)} />
              <YAxis type="category" dataKey="description" width={120} />
              <Tooltip {...CHART_TOOLTIP_PROPS} formatter={(value: number) => currencyFormat(value)} />
              <Bar dataKey="EXPENSE" name={translate("panel.charts.series.expense", "Expense")} stackId="a" fill={EXPENSE_COLOR} />
              <Bar dataKey="INCOME" name={translate("panel.charts.series.income", "Income")} stackId="a" fill={INCOME_COLOR} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
