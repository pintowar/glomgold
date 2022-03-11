import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

import { Row, Col, Card, Space, DatePicker, Table, Tabs } from 'antd';
import Chart from "react-apexcharts";
import { AxiosInstance } from 'axios';
import moment from 'moment';

import { PanelLayout } from "./layout";
import { ApexOptions } from "apexcharts";

interface ReportPanelProps {
    axios: AxiosInstance
}

export const ReportPanel: React.FC<ReportPanelProps> = ({axios}) => {
    const periodFormat = 'YYYY';
    const location = useLocation();
    const navigate = useNavigate();
    const period = new URLSearchParams(location.search).get("period") || moment().format(periodFormat);

    const [currentPeriod, setCurrentPeriod] = useState(moment(period, periodFormat));
    const [dataTable, setDataTable] = useState({
        columns: [],
        data: [],
        rowSummary: [],
        rowTrend: [],
        colSummary: [],
        total: 0
    });

    const onChangePeriod = (date: any, _: string) => setCurrentPeriod(date);

    useEffect(() => {
        populateData()
    }, [currentPeriod]);

    const populateData = async () => {
        const {status, data} = await axios.get(`/api/panel/report?year=${currentPeriod.year()}`)
        if (status === 200) {
            setDataTable({
                columns: data.columns.map((col: string) => ({title: col, dataIndex: col, key: col})),
                data: data.data.map((row: any, idx: number) => ({key: `${idx}`, ...row})),
                rowSummary: data.rowSummary,
                rowTrend: data.rowTrend,
                colSummary: data.colSummary,
                total: data.total
            });
            navigate(`/report?period=${currentPeriod.format(periodFormat)}`)
        } else throw Error()
    }

    const cols = [...(dataTable.columns)]
    cols.shift()
    const lineChartConfig = {
        options: {
            title: { text: "Month Evolution" },
            chart: { id: "line" },
            stroke: { curve: "smooth", dashArray: [0, 8], width: [3, 2] },
            colors: ['#77B6EA', '#F36565'],
            xaxis: { categories: cols.map(({title}) => title)}
        } as ApexOptions,
        series: [
            { name: "value", data: dataTable.rowSummary.map((it) => it !== 0 ? it : null) },
            { name: "trend", data: dataTable.rowTrend.map((it) => it !== 0 ? it : null) }
        ]
    };

    const barChartConfig = {
        options: {
            title: { text: "Annual Item Cost" },
            chart: { id: "bar" },
            plotOptions: { bar: { borderRadius: 4 } },
            dataLabels: { enabled: false },
            colors: ['#77B6EA'],
            xaxis: { categories: dataTable.data.map(({Description}) => Description) }
        } as ApexOptions,
        series: [
            { name: "value", data: dataTable.colSummary.map((it) => it !== 0 ? it : null) }
        ]
    };

    return (
        <PanelLayout>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card title={"Report Navigation"} bordered={false}>
                            <Space direction="vertical" size={12} style={{width: '100%'}}>
                                <DatePicker value={currentPeriod} picker="year" onChange={onChangePeriod} allowClear={false}/>
                                <Tabs>
                                    <Tabs.TabPane tab="Table" key={1}>
                                        <Table 
                                            columns={dataTable.columns} 
                                            dataSource={dataTable.data} 
                                            size="small" 
                                            pagination={{ position: [] }}
                                            bordered
                                            summary={() => 
                                                <Table.Summary fixed>
                                                    <Table.Summary.Row>
                                                        <Table.Summary.Cell key={0} index={0}>
                                                            <strong>Total</strong>
                                                        </Table.Summary.Cell>
                                                        {dataTable.rowSummary.map((it, idx) =>
                                                            <Table.Summary.Cell key={idx + 1} index={idx}>{it}</Table.Summary.Cell>
                                                        )}
                                                        <Table.Summary.Cell key={dataTable.rowSummary.length+1} index={dataTable.rowSummary.length+1}>
                                                            <strong>{dataTable.total}</strong>
                                                        </Table.Summary.Cell>
                                                    </Table.Summary.Row>
                                                </Table.Summary>
                                            }
                                        />
                                    </Tabs.TabPane>
                                    <Tabs.TabPane tab="Chart" key={2}>
                                        <Space direction="vertical" size={12} style={{width: '100%'}}>
                                            <Chart
                                                options={lineChartConfig.options}
                                                series={lineChartConfig.series}
                                                type="line"
                                                height={350}
                                                width="100%"
                                            />
                                            <Chart
                                                options={barChartConfig.options}
                                                series={barChartConfig.series}
                                                type="bar"
                                                height={350}
                                                width="100%"
                                            />
                                        </Space>
                                    </Tabs.TabPane>
                                </Tabs>
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </div>
        </PanelLayout>
    );
}