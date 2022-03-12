import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';

import { Row, Col, Card, Space, DatePicker, Tabs } from 'antd';

import { AxiosInstance } from 'axios';
import moment from 'moment';

import { PanelLayout } from "./layout";
import { ItemChart, PeriodChart, AnnualTable } from './components/report';

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
                columns: data.columns,
                data: data.data,
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

    return (
        <PanelLayout>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card title={"Report Navigation"} bordered={false}>
                            <DatePicker value={currentPeriod} picker="year" onChange={onChangePeriod} allowClear={false}/>
                        </Card>
                    </Col>
                </Row>
            </div>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={24}>
                        <Card bordered={false}>
                            <Space direction="vertical" size={12} style={{width: '100%'}}>
                                <Tabs>
                                    <Tabs.TabPane tab="Table" key={1}>
                                        <AnnualTable columns={dataTable.columns} rows={dataTable.data} rowSummary={dataTable.rowSummary} total={dataTable.total}/>
                                    </Tabs.TabPane>
                                    <Tabs.TabPane tab="Chart" key={2}>
                                        <Space direction="vertical" size={12} style={{width: '100%'}}>
                                            <PeriodChart cols={cols} data={dataTable.rowSummary} trend={dataTable.rowTrend}/>
                                            <ItemChart cols={dataTable.data.map(({Description}) => Description) } data={dataTable.colSummary}/>
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