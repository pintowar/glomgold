import React, { useEffect, useState } from "react";
import { useLocation } from 'react-router-dom';

import { Row, Col, Card, Space, Input, InputNumber, DatePicker, Button, Table, Statistic, Form } from 'antd';
import { LeftOutlined, RightOutlined, RiseOutlined, WalletOutlined, DeleteOutlined } from '@ant-design/icons';
import { AxiosInstance } from 'axios';
import Chart from "react-apexcharts";
import moment from 'moment';

import { PanelLayout } from "./layout";

import './control.css'
import { IItem } from '../../interfaces'
import { idText } from "typescript";

interface ControlPanelData {
    items: IItem[]
    stats: IItem[]
    total: number
    diff: number
}

interface ControlPanelProps {
    axios: AxiosInstance
}

const barChartConfig = (data: ControlPanelData) => ({
    options: {
        chart: { id: "basic-bar" },
        plotOptions: { bar: { horizontal: true } },
        xaxis: { categories: data.stats.map(it => it.description) }
    },
    series: [
        { name: "value", data: data.stats.map(it => it.value) }
    ]
})

export const ControlPanel: React.FC<ControlPanelProps> = ({axios}) => {
    const periodFormat = 'YYYY-MM';
    const location = useLocation();
    const period = new URLSearchParams(location.search).get("period") || moment().format(periodFormat);

    const [currentPeriod, setCurrentPeriod] = useState(moment(period, periodFormat));
    const [panelData, setPanelData] = useState<ControlPanelData>({
        items: [],
        stats: [],
        total: 0,
        diff: 0
    });

    const [form] = Form.useForm();

    useEffect(() => {
        populateData()
    }, [currentPeriod]);

    const onChangePeriod = (date: any, _: string) => setCurrentPeriod(date);

    const populateData = async () => {
        const {status, data} = await axios.get(`/api/panel?year=${currentPeriod.year()}&month=${currentPeriod.month() + 1}`)
        if (status === 200) {
            setPanelData(data)
        } else throw Error()
    }

    const onAddItem = async () => {
        const year = currentPeriod.year()
        const month = currentPeriod.month() + 1
        const {description, value} = form.getFieldsValue()

        const {status, data} = await axios.post("/api/panel/add-item", {year, month, description, value})
        if (status === 200) {
            form.resetFields()
            setPanelData(data)
        } else throw Error()
    };

    const onDeleteItem = async (record: any) => {
        const {key} = record
        const {status, data} = await axios.post(`/api/panel/remove-item/${key}`)
        if (status === 200) {
            form.resetFields()
            setPanelData(data)
        } else throw Error()
    };

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
            render: (_: any, record: any) => <Button type="text" onClick={() => onDeleteItem(record)} danger><DeleteOutlined/></Button>,
        },
    ];

    const config = barChartConfig(panelData);
    const tableData = panelData.items.map(({id, description, value}) => ({key: id, description, value}));

    return (
        <PanelLayout>
            <div className="card-row">
                <Row gutter={[24, 24]}>
                    <Col span={12}>
                        <Card title={"Period Navigation"} bordered={false}>
                            <Space direction="vertical" size={12}>
                                <Space direction="horizontal" size={2}>
                                    <Button type="text" onClick={() => setCurrentPeriod(currentPeriod.clone().add(-1, 'M'))}><LeftOutlined/></Button>
                                    <Button type="text" onClick={() => setCurrentPeriod(currentPeriod.clone().add(1, 'M'))}><RightOutlined/></Button>
                                    <DatePicker value={currentPeriod} format={periodFormat} onChange={onChangePeriod} picker="month" allowClear={false}/>
                                </Space>
                            </Space>
                        </Card>
                    </Col>
                    <Col span={12}>
                        <Card title="Period Summary" bordered={false}>
                            <Space direction="horizontal" size={32}>
                                <Statistic
                                    title="Monthly Cost"
                                    value={panelData.total}
                                    precision={2}
                                    valueStyle={{ color: '#3f8600' }}
                                    prefix={<WalletOutlined />}
                                    suffix="$"
                                />
                                <Statistic
                                    title="Monthly Difference"
                                    value={panelData.diff}
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
                                <Form form={form} layout="inline">
                                    {/* <Space direction="horizontal" size={6} wrap> */}
                                        <Form.Item name="description" rules={[{ required: true }]}>
                                            <Input placeholder="Description"/>
                                        </Form.Item>
                                        <Form.Item name="value" rules={[{ required: true }]}>
                                            <InputNumber placeholder="Value" />
                                        </Form.Item>
                                    {/* </Space> */}
                                </Form>
                                <Button type="primary" onClick={onAddItem}>Add Item</Button>
                                <Table columns={columns} dataSource={tableData} size="small" />                                    
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