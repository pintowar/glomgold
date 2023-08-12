import React, { useContext } from "react";
import { ColorModeContext } from "../../../contexts/color-mode";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { EXPENSE_COLOR, INCOME_COLOR } from "../../../constants";

const groupItemsByValue = (values: number[]) => {
  const grouped = new Map<string, (number | null)[]>();
  values
    .map((it) => (it !== 0 ? it : null))
    .forEach((value) => {
      const types = ["EXPENSE", "INCOME"];
      const currentType = (value || 0) < 0 ? types[0] : types[1];
      types.forEach((type) =>
        grouped.set(type, (grouped.get(type) || []).concat(currentType === type ? [value] : [null]))
      );
    });
  return grouped;
};

interface ItemChartProps {
  cols: string[];
  data: number[];
  locale: string;
  currency: string;
}

export const ItemChart: React.FC<ItemChartProps> = ({ cols, data, locale, currency }) => {
  const { mode } = useContext(ColorModeContext);

  const currencyFormat = (value: number) => value.toLocaleString(locale, { style: "currency", currency });

  const barChartOptions = {
    title: { text: "Average Item Cost" },
    chart: { id: "bar", background: "transparent", stacked: true, animations: { enabled: false } },
    plotOptions: { bar: { borderRadius: 4 } },
    dataLabels: { enabled: false },
    colors: [EXPENSE_COLOR, INCOME_COLOR],
    theme: { mode },
    tooltip: { y: { formatter: currencyFormat } },
    xaxis: { categories: cols },
  } as ApexOptions;

  const groupedValues = groupItemsByValue(data);
  const series = Array.from(groupedValues.keys()).map((key) => ({ name: key, data: groupedValues.get(key) || [] }));

  return <Chart options={barChartOptions} series={series} type="bar" height={350} width="100%" />;
};
