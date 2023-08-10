import { IItem } from "../../../interfaces";
import React, { useContext } from "react";
import { ColorModeContext } from "../../../contexts/color-mode";
import { Card } from "antd";
import Chart from "react-apexcharts";

interface MonthStatsCardProps {
  tableData: IItem[];
  locale: string;
  currency: string;
}

const groupItemsByType = (items: IItem[]) => {
  const types = ["EXPENSE", "INCOME"];
  const grouped = new Map<string, (number | null)[]>();
  types.forEach((type) =>
    grouped.set(
      type,
      items.map((i) => (i.itemType === type ? i.value : null))
    )
  );
  return grouped;
};

export const MonthStatsCard: React.FC<MonthStatsCardProps> = ({ tableData, locale, currency }) => {
  const { mode } = useContext(ColorModeContext);
  const themeMode: "dark" | "light" = mode === "dark" ? "dark" : "light";

  const currencyFormat = (value: number) => value.toLocaleString(locale, { style: "currency", currency });

  const barChartOptions = {
    chart: { id: "basic-bar", background: "transparent", stacked: true, animations: { enabled: false } },
    plotOptions: { bar: { horizontal: true } },
    dataLabels: { enabled: false, formatter: currencyFormat },
    colors: ["#FF4560", "#77B6EA"],
    theme: { mode: themeMode },
    tooltip: { y: { formatter: currencyFormat } },
    xaxis: {
      categories: tableData.map((it) => it.description),
    },
  };

  const groupedTable = groupItemsByType(tableData);
  const series = Array.from(groupedTable.keys()).map((key) => ({ name: key, data: groupedTable.get(key) || [] }));

  // const series = [{ name: "value", data: tableData.map((it) => it.value) }];

  return (
    <Card title="Month Stats" bordered={false}>
      <Chart options={barChartOptions} series={series} type="bar" width="100%" />
    </Card>
  );
};
