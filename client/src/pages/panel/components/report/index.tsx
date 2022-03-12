import React from "react";

import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Table } from 'antd';

interface ChartReportProps {
    cols: string[]
    data: number[],
    trend?: number[]
}

export const PeriodChart: React.FC<ChartReportProps> = ({cols, data, trend}) => {
    const lineChartConfig = {
        options: {
            title: { text: "Month Evolution" },
            chart: { id: "line" },
            stroke: { curve: "smooth", dashArray: [0, 8], width: [3, 2] },
            colors: ['#77B6EA', '#F36565'],
            xaxis: { categories: cols}
        } as ApexOptions,
        series: [
            { name: "value", data: data.map((it) => it !== 0 ? it : null) },
            { name: "trend", data: (trend || []).map((it) => it !== 0 ? it : null) }
        ]
    };

    return (
        <Chart
            options={lineChartConfig.options}
            series={lineChartConfig.series}
            type="line"
            height={350}
            width="100%"
        />
    )
}

export const ItemChart: React.FC<ChartReportProps> = ({cols, data}) => {
    const barChartConfig = {
        options: {
            title: { text: "Annual Item Cost" },
            chart: { id: "bar" },
            plotOptions: { bar: { borderRadius: 4 } },
            dataLabels: { enabled: false },
            colors: ['#77B6EA'],
            xaxis: { categories: cols }
        } as ApexOptions,
        series: [
            { name: "value", data: data.map((it) => it !== 0 ? it : null) }
        ]
    };

    return (
        <Chart
            options={barChartConfig.options}
            series={barChartConfig.series}
            type="bar"
            height={350}
            width="100%"
        />
    )
}

interface AnnualTableProps {
    columns: string[]
    rows: any[]
    rowSummary: number[]
    total: number
}

export const AnnualTable: React.FC<AnnualTableProps> = ({columns, rows, rowSummary, total}) => {

    return (
        <Table 
            columns={columns.map((col: string) => ({title: col, dataIndex: col, key: col}))} 
            dataSource={rows.map((row: any, idx: number) => ({key: `${idx}`, ...row}))} 
            size="small" 
            pagination={{ position: [] }}
            bordered
            summary={() => 
                <Table.Summary fixed>
                    <Table.Summary.Row>
                        <Table.Summary.Cell key={0} index={0}>
                            <strong>Total</strong>
                        </Table.Summary.Cell>
                        {rowSummary.map((it, idx) =>
                            <Table.Summary.Cell key={idx + 1} index={idx}>{it}</Table.Summary.Cell>
                        )}
                        <Table.Summary.Cell key={rowSummary.length + 1} index={rowSummary.length + 1}>
                            <strong>{total}</strong>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                </Table.Summary>
            }
        />
    )
}