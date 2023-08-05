import React, { useContext } from "react";
import { ColorModeContext } from "../../../../contexts/color-mode";
import { ApexOptions } from "apexcharts";
import Chart from "react-apexcharts";

interface ItemChartProps {
  cols: string[];
  data: number[];
  locale: string;
  currency: string;
}

export const ItemChart: React.FC<ItemChartProps> = ({ cols, data, locale, currency }) => {
  const { mode } = useContext(ColorModeContext);

  const currencyFormat = (value: number) => value.toLocaleString(locale, { style: "currency", currency });

  const barChartConfig = {
    options: {
      title: { text: "Average Item Cost" },
      chart: { id: "bar", background: "transparent" },
      plotOptions: { bar: { borderRadius: 4 } },
      dataLabels: { enabled: false },
      colors: ["#77B6EA"],
      theme: { mode },
      tooltip: { y: { formatter: currencyFormat } },
      xaxis: { categories: cols },
    } as ApexOptions,
    series: [{ name: "value", data: data.map((it) => (it !== 0 ? it : null)) }],
  };

  return <Chart options={barChartConfig.options} series={barChartConfig.series} type="bar" height={350} width="100%" />;
};
