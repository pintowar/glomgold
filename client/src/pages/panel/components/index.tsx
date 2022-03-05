import { Card, Space, DatePicker, Input, InputNumber, Button, Table, Statistic, Form, FormInstance, } from 'antd';
import Highlighter from 'react-highlight-words';
import { LeftOutlined, RightOutlined, DeleteOutlined, EditOutlined, WalletOutlined, RiseOutlined, SearchOutlined } from '@ant-design/icons';
import Chart from "react-apexcharts";

import { IItem } from '../../../interfaces'
import { PanelItem } from '../control'
import { useState } from 'react';
import { ColumnType } from 'antd/lib/table';

interface MonthItemsCardProps {
    form: FormInstance
    onAddItem: () => Promise<void>
    onDeleteItem: (item: PanelItem) => Promise<void>
    tableData: PanelItem[]
}

export const MonthItemsCard: React.FC<MonthItemsCardProps> = ({form, tableData, onAddItem, onDeleteItem}) => {

    let searchInput: Input | null = null
    const [filterState, setFilterState] = useState({
        searchText: '',
        searchedColumn: ''
    });

    const handleSearch = (selectedKeys: React.Key[], confirm: (param?: any) => void, dataIndex: string) => {
        confirm();
        setFilterState({
          searchText: `${selectedKeys[0]}`,
          searchedColumn: dataIndex,
        });
    };

    const handleReset = (clearFilters: (() => void) | undefined) => {
        if(clearFilters) clearFilters();
        setFilterState(state => ({...state, searchText: '' }));
    };

    const getColumnSearchProps = (dataIndex: string): ColumnType<PanelItem> => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    ref={node => {
                        searchInput = node
                    }}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                    />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => handleSearch(selectedKeys, confirm, dataIndex)}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Search
                    </Button>
                    <Button onClick={() => handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                        Reset
                    </Button>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => {
                            confirm({ closeDropdown: false });
                            setFilterState({
                                searchText: `${selectedKeys[0]}`,
                                searchedColumn: dataIndex,
                            });
                        }}
                    >
                        Filter
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value: string | number | boolean, record: PanelItem) => {
            switch(dataIndex) {
                case 'description':
                    return record.description.toLowerCase().includes(`${value}`.toLowerCase())
                case 'value':
                    return `${record.value}`.toLowerCase().includes(`${value}`.toLowerCase())
                default:
                    return false
            }
        },
        onFilterDropdownVisibleChange: visible => {
              if (visible) {
                setTimeout(() => searchInput?.select(), 100);
              }
        },
        render: text =>
          filterState.searchedColumn === dataIndex ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[filterState.searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ''}
            />
          ) : (
            text
          ),
    })
    
     const columns = [
        {
            key: 'description',
            title: 'Description',
            dataIndex: 'description',
            sorter: (a: PanelItem, b: PanelItem) => a.description.localeCompare(b.description),
            ...getColumnSearchProps('description'),
        },
        {
            key: 'value',
            title: 'Value',
            dataIndex: 'value',
            sorter: (a: PanelItem, b: PanelItem) => a.value - b.value,
            ...getColumnSearchProps('value'),
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