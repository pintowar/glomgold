import { IItem } from "../../../interfaces";
import React, { useContext, useMemo } from "react";
import { useTranslate } from "@refinedev/core";
import { ColorModeContext } from "../../../contexts/color-mode";
import { Card } from "antd";
import Chart from "react-apexcharts";
import { EXPENSE_COLOR, INCOME_COLOR, ITEM_TYPES } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";

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
  const types = ITEM_TYPES;

  return types.map((type) => ({
    name: type,
    data: descriptions.flatMap((desc) =>
      (items.get(desc) || []).filter((i) => i.itemType === type).reduce((acc, i) => acc + i.value, 0)
    ),
  }));
};

export const MonthStatsCard: React.FC<MonthStatsCardProps> = ({ tableData, locale, currency }) => {
  const translate = useTranslate();
  const { mode } = useContext(ColorModeContext);
  const themeMode: "dark" | "light" = mode === "dark" ? "dark" : "light";

  const currencyFormat = useCurrencyFormat(locale, currency);

  const nameGrouped = useMemo(() => groupItemsByDescription(tableData), [tableData]);
  const categories = useMemo(() => Array.from(nameGrouped.keys()), [nameGrouped]);
  const series = useMemo(
    () =>
      groupItemsByType(nameGrouped).map((entry) => ({
        ...entry,
        name: translate(`panel.charts.series.${entry.name.toLowerCase()}`, entry.name),
      })),
    [nameGrouped, translate]
  );

  const barChartOptions = useMemo(
    () => ({
      chart: { id: "basic-bar", background: "transparent", stacked: true, animations: { enabled: false } },
      plotOptions: { bar: { horizontal: true } },
      dataLabels: { enabled: false, formatter: currencyFormat },
      colors: [EXPENSE_COLOR, INCOME_COLOR],
      theme: { mode: themeMode },
      tooltip: { y: { formatter: currencyFormat } },
      xaxis: {
        categories,
      },
    }),
    [currencyFormat, themeMode, categories]
  );

  return (
    <Card
      title={translate("panel.monthStats.title", "Month Stats")}
      variant="borderless"
      style={{ height: "100%", width: "100%", display: "flex", flexDirection: "column" }}
      styles={{ body: { flex: 1, minHeight: 0, display: "flex" } }}
    >
      <div style={{ height: "100%", width: "100%" }}>
        <Chart options={barChartOptions} series={series} type="bar" width="100%" height="100%" />
      </div>
    </Card>
  );
};
