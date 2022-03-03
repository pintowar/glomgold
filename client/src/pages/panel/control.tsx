import React, { useState } from "react";
import { useLocation } from 'react-router-dom';

import { Row, Col, Card, Space, Input, InputNumber, DatePicker, Button, Table, Statistic } from 'antd';
import { LeftOutlined, RightOutlined, RiseOutlined, WalletOutlined, DeleteOutlined } from '@ant-design/icons';
import Chart from "react-apexcharts";
import moment from 'moment';

import { PanelLayout } from "./layout";

import './control.css'

export const ControlPanel: React.FC = () => {
    const periodFormat = 'YYYY-MM';
    const location = useLocation();
    const period = new URLSearchParams(location.search).get("period") || moment().format(periodFormat);

    const [currentPeriod, setCurrentPeriod] = useState(moment(period, periodFormat));

    const onChangePeriod = (date: any, _: string) => setCurrentPeriod(date);

    const columns = [
        {
            key: 'description',
            title: 'Description',
            dataIndex: 'description',
        },
        {
            key: 'value',
            title: 'Value',
            dataIndex: 'value',
        },
        {
            title: 'Action',
            key: 'operation',
            // fixed: 'right',
            // width: 100,
            render: () => <Button type="text" danger><DeleteOutlined/></Button>,
        },
    ];
    const data = [
            {
            key: '1',
            description: 'Water',
            value: 10,
        },
        {
            key: '2',
            description: 'Groceries',
            value: 200,
        },
        {
            key: '3',
            description: 'Clothing',
            value: 500,
        },
        {
            key: '4',
            description: 'Books',
            value: 150,
        },
    ];

    const config = {
        options: {
            chart: {
                id: "basic-bar"
            },
            plotOptions: {
                bar: {
                    horizontal: true
                }
            },
            xaxis: {
                categories: data.map(it => it.description)
            }
        },
        series: [
            {
                name: "value",
                data: data.map(it => it.value)
            }
        ]
    };

    return (
        <PanelLayout>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <Card title={`Period Navigation ${currentPeriod.format(periodFormat)}`} bordered={false}>
                            <Space direction="vertical" size={12}>
                                <Space direction="horizontal" size={2}>
                                    <Button type="text" onClick={() => setCurrentPeriod(currentPeriod.clone().add(-1, 'M'))}><LeftOutlined/></Button>
                                    <Button type="text" onClick={() => setCurrentPeriod(currentPeriod.clone().add(1, 'M'))}><RightOutlined/></Button>
                                </Space>
                                <Space direction="horizontal" size={6}>
                                    <DatePicker value={currentPeriod} format={periodFormat} onChange={onChangePeriod} picker="month" allowClear={false}/>
                                    <Button type="primary">Go</Button>
                                </Space>
                            </Space>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Period Summary" bordered={false}>
                            <Space direction="horizontal" size={32}>
                                <Statistic
                                    title="Monthly Cost"
                                    value={860.00}
                                    precision={2}
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix={<WalletOutlined />}
                                    suffix="$"
                                />
                                <Statistic
                                    title="Monthly Difference"
                                    value={42}
                                    precision={2}
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix={<RiseOutlined />}
                                    suffix="%"
                                />
                            </Space>
                        </Card>
                    </Col>
                </Row>
            </div>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <Card title="Month Items" bordered={false}>
                            <Space direction="vertical" size={12} wrap style={{width: '100%'}}>
                                <Space direction="horizontal" size={6} wrap>
                                    <Input placeholder="Description"/>
                                    <InputNumber placeholder="Value" />
                                </Space>
                                <Button type="primary">Add Item</Button>
                                <Table columns={columns} dataSource={data} size="small" />                                    
                            </Space>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Month Stats" bordered={false}>
                            <Chart
                                options={config.options}
                                series={config.series}
                                type="bar"
                                width="500"
                            />
                        </Card>
                    </Col>
                </Row>
            </div>
        </PanelLayout>
    );
}