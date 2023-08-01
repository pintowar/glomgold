import React, { useContext } from "react";

import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Table, theme } from "antd";
import { Link } from "react-router-dom";
import { ColorModeContext } from "../../../../contexts/color-mode";

interface ChartReportProps {
    cols: string[];
    data: number[];
    trend?: number[];
    locale: string;
    currency: string;
}

export const PeriodChart: React.FC<ChartReportProps> = ({ cols, data, trend, locale, currency }) => {
    const { mode } = useContext(ColorModeContext);
    const { useToken } = theme;
    const { token } = useToken();

    const currencyFormat = (value: number | null) => value?.toLocaleString(locale, { style: "currency", currency });

    const lineChartConfig = {
        options: {
            title: { text: "Month Evolution" },
            chart: { id: "line", background: token.colorBgContainer },
            stroke: { curve: "smooth", dashArray: [0, 8], width: [3, 2] },
            colors: ["#77B6EA", "#F36565"],
            theme: { mode },
            tooltip: { y: { formatter: currencyFormat } },
            xaxis: { categories: cols },
        } as ApexOptions,
        series: [
            { name: "value", data: data.map((it) => (it !== 0 ? it : null)) },
            { name: "trend", data: (trend || []).map((it) => (it !== 0 ? it : null)) },
        ],
    };

    return (
        <Chart
            options={lineChartConfig.options}
            series={lineChartConfig.series}
            type="line"
            height={350}
            width="100%"
        />
    );
};

export const ItemChart: React.FC<ChartReportProps> = ({ cols, data, locale, currency }) => {
    const { mode } = useContext(ColorModeContext);
    const { useToken } = theme;
    const { token } = useToken();

    const currencyFormat = (value: number) => value.toLocaleString(locale, { style: "currency", currency });

    const barChartConfig = {
        options: {
            title: { text: "Average Item Cost" },
            chart: { id: "bar", background: token.colorBgContainer },
            plotOptions: { bar: { borderRadius: 4 } },
            dataLabels: { enabled: false },
            colors: ["#77B6EA"],
            theme: { mode },
            tooltip: { y: { formatter: currencyFormat } },
            xaxis: { categories: cols },
        } as ApexOptions,
        series: [{ name: "value", data: data.map((it) => (it !== 0 ? it : null)) }],
    };

    return (
        <Chart options={barChartConfig.options} series={barChartConfig.series} type="bar" height={350} width="100%" />
    );
};

interface AnnualTableProps {
    year: string;
    locale: string;
    currency: string;
    columns: string[];
    rowIndex: string[];
    data: number[][];
    rowSummary: number[];
    colSummary: number[];
    total: number;
}

export const AnnualTable: React.FC<AnnualTableProps> = ({
    year,
    locale,
    currency,
    columns,
    rowIndex,
    data,
    rowSummary,
    colSummary,
    total,
}) => {
    const currencyFormatFactory = (month?: number, desc?: string) => {
        const currencyFormat = (value?: number) => {
            const valueFormat = value ? value.toLocaleString(locale, { style: "currency", currency: currency }) : "";
            if (month && desc) {
                const formattedMonth = `${month}`.padStart(2, "0");
                return <Link to={`/panel?period=${year}-${formattedMonth}&desc=${desc}`} >{valueFormat}</Link>
            } else {
                return <>{valueFormat}</>;
            }
        };
        return currencyFormat;
    };

    const currencyFormat = currencyFormatFactory();

    const tableCols = [{ title: "", dataIndex: "desc", key: "desc", render: (value?: number) => <>{value}</> }]
        .concat(
            columns.map((col: string) => ({
                title: col,
                dataIndex: col,
                key: col,
                render: (value?: number) => <>{value}</>,
            }))
        )
        .concat([{ title: "Total", dataIndex: "total", key: "total", render: currencyFormatFactory() }]);

    const source = rowIndex.map((desc, row) => {
        const summary = { key: row, desc: desc, total: colSummary[row] };
        const dataCols = columns.reduce((acc, col, idx) => {
            const cell = data[row][idx];
            const formattedCell = cell ? currencyFormatFactory(idx + 1, desc)(cell) : cell;
            return { [col]: formattedCell, ...acc };
        }, {});

        return { ...dataCols, ...summary };
    });

    return (
        <Table
            columns={tableCols}
            dataSource={source}
            size="small"
            pagination={false}
            bordered
            summary={() => (
                <Table.Summary fixed>
                    <Table.Summary.Row>
                        <Table.Summary.Cell key={0} index={0}>
                            <strong>Total</strong>
                        </Table.Summary.Cell>
                        {rowSummary.map((it, idx) => (
                            <Table.Summary.Cell key={idx + 1} index={idx}>
                                {currencyFormat(it)}
                            </Table.Summary.Cell>
                        ))}
                        <Table.Summary.Cell key={rowSummary.length + 1} index={rowSummary.length + 1}>
                            <strong>{currencyFormat(total)}</strong>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                </Table.Summary>
            )}
        />
    );
};
