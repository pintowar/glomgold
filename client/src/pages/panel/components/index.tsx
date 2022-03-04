import { Card, Space, DatePicker, Input, InputNumber, Button, Table, Statistic, Form, FormInstance } from 'antd';
import { LeftOutlined, RightOutlined, DeleteOutlined, EditOutlined, WalletOutlined, RiseOutlined } from '@ant-design/icons';
import Chart from "react-apexcharts";

import { IItem } from '../../../interfaces'
import { PanelItem } from '../control'

interface MonthItemsCardProps {
    form: FormInstance
    onAddItem: () => Promise<void>
    onDeleteItem: (item: PanelItem) => Promise<void>
    tableData: PanelItem[]
}

export const MonthItemsCard: React.FC<MonthItemsCardProps> = ({form, tableData, onAddItem, onDeleteItem}) => {
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
            render: (_: any, record: PanelItem) => (
                <>
                    <Button type="text"><EditOutlined/></Button>
                    <Button type="text" onClick={() => onDeleteItem(record)} danger><DeleteOutlined/></Button>
                </>
            ),
        },
    ];

    return (
        <Card title="Month Items" bordered={false}>
            <Space direction="vertical" size={12} wrap style={{width: '100%'}}>
                <Form form={form} layout="inline">
                    <Form.Item name="description" rules={[{ required: true }]}>
                        <Input placeholder="Description"/>
                    </Form.Item>
                    <Form.Item name="value" rules={[{ required: true }]}>
                        <InputNumber placeholder="Value" />
                    </Form.Item>
                </Form>
                <Button type="primary" onClick={onAddItem}>Add Item</Button>
                <Table columns={columns} dataSource={tableData} size="small" />                                    
            </Space>
        </Card>
    )
}

interface MonthStatsCardProps {
    tableData: IItem[]
}

export const MonthStatsCard: React.FC<MonthStatsCardProps> = ({tableData}) => {

    const barChartConfig = {
        options: {
            chart: { id: "basic-bar" },
            plotOptions: { bar: { horizontal: true } },
            xaxis: { categories: tableData.map(it => it.description) }
        },
        series: [
            { name: "value", data: tableData.map(it => it.value) }
        ]
    };

    return (
        <Card title="Month Stats" bordered={false}>
            <Chart
                options={barChartConfig.options}
                series={barChartConfig.series}
                type="bar"
                width="500"
            />
        </Card>
    );
}

interface PeriodNavigationCardProps {
    format: string
    value: moment.Moment
    onValueChange: React.Dispatch<React.SetStateAction<moment.Moment>>
}

export const PeriodNavigationCard: React.FC<PeriodNavigationCardProps> = ({value, format, onValueChange}) => {

    const onChangePeriod = (date: any, _: string) => onValueChange(date);

    return (
        <Card title={"Period Navigation"} bordered={false}>
            <Space direction="vertical" size={12}>
                <Space direction="horizontal" size={2}>
                    <Button type="text" onClick={() => onValueChange(period => period.clone().add(-1, 'M'))}><LeftOutlined/></Button>
                    <Button type="text" onClick={() => onValueChange(period => period.clone().add(1, 'M'))}><RightOutlined/></Button>
                    <DatePicker value={value} format={format} onChange={onChangePeriod} picker="month" allowClear={false}/>
                </Space>
            </Space>
        </Card>
    );
}

interface PeriodSummaryCardProps {
    total: number
    difference: number
}

export const PeriodSummaryCard: React.FC<PeriodSummaryCardProps> = ({total, difference}) => {
    return (
        <Card title="Period Summary" bordered={false}>
            <Space direction="horizontal" size={32}>
                <Statistic
                    title="Monthly Cost"
                    value={total}
                    precision={2}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<WalletOutlined />}
                    suffix="$"
                />
                <Statistic
                    title="Monthly Difference"
                    value={difference}
                    precision={2}
                    valueStyle={{ color: '#3f8600' }}
                    prefix={<RiseOutlined />}
                    suffix="%"
                />
            </Space>
        </Card>
    )
}