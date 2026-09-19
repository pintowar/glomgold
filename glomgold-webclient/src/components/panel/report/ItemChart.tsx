import React, { useContext, useMemo } from "react";
import { ColorModeContext } from "../../../contexts/color-mode";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";
import { EXPENSE_COLOR, INCOME_COLOR, ITEM_TYPES } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";

const groupItemsByValue = (values: number[]) => {
  const grouped = new Map<string, (number | null)[]>();
  values
    .map((it) => (it !== 0 ? it : null))
    .forEach((value) => {
      const types = ITEM_TYPES;
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

  const currencyFormat = useCurrencyFormat(locale, currency);

  const groupedValues = useMemo(() => groupItemsByValue(data), [data]);
  const series = useMemo(
    () => Array.from(groupedValues.keys()).map((key) => ({ name: key, data: groupedValues.get(key) || [] })),
    [groupedValues]
  );

  const barChartOptions = useMemo(
    () =>
      ({
        title: { text: "Average Item Cost" },
        chart: { id: "bar", background: "transparent", stacked: true, animations: { enabled: false } },
        plotOptions: { bar: { borderRadius: 4 } },
        dataLabels: { enabled: false },
        colors: [EXPENSE_COLOR, INCOME_COLOR],
        theme: { mode },
        tooltip: { y: { formatter: currencyFormat } },
        xaxis: { categories: cols },
      }) as ApexOptions,
    [cols, currencyFormat, mode]
  );

  return <Chart options={barChartOptions} series={series} type="bar" height={350} width="100%" />;
};
