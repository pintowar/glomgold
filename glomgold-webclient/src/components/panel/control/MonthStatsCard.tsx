import { IItem } from "../../../interfaces";
import React, { useContext } from "react";
import { ColorModeContext } from "../../../contexts/color-mode";
import { Card } from "antd";
import Chart from "react-apexcharts";
import { EXPENSE_COLOR, INCOME_COLOR } from "../../../constants";

interface MonthStatsCardProps {
  tableData: IItem[];
  locale: string;
  currency: string;
}

const groupItemsByDescription = (items: IItem[]) => {
  const grouped = new Map<string, IItem[]>();
  items.forEach((item) => grouped.set(item.description, (grouped.get(item.description) || []).concat(item)));
  return grouped;
};

const groupItemsByType = (items: Map<string, IItem[]>) => {
  const descriptions = Array.from(items.keys());
  const types = ["EXPENSE", "INCOME"];

  return types.map((type) => ({
    name: type,
    data: descriptions.flatMap((desc) =>
      (items.get(desc) || []).filter((i) => i.itemType === type).reduce((acc, i) => acc + i.value, 0)
    ),
  }));
};

export const MonthStatsCard: React.FC<MonthStatsCardProps> = ({ tableData, locale, currency }) => {
  const { mode } = useContext(ColorModeContext);
  const themeMode: "dark" | "light" = mode === "dark" ? "dark" : "light";

  const currencyFormat = (value: number) => value.toLocaleString(locale, { style: "currency", currency });

  const nameGrouped = groupItemsByDescription(tableData);

  const barChartOptions = {
    chart: { id: "basic-bar", background: "transparent", stacked: true, animations: { enabled: false } },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: false, formatter: currencyFormat },
    colors: [EXPENSE_COLOR, INCOME_COLOR],
    theme: { mode: themeMode },
    tooltip: { y: { formatter: currencyFormat } },
    xaxis: {
      categories: Array.from(nameGrouped.keys()),
    },
  };

  const series = groupItemsByType(nameGrouped);

  return (
    <Card title="Month Stats" bordered={false}>
      <Chart options={barChartOptions} series={series} type="bar" width="100%" />
    </Card>
  );
};
