import React, { useContext, useEffect, useMemo, useRef, useState } from "react";

import {
    Card,
    Space,
    DatePicker,
    Input,
    InputRef,
    InputNumber,
    AutoComplete,
    Button,
    Table,
    Statistic,
    Form,
    Typography,
    Popconfirm,
    Modal,
    theme,
} from "antd";
import { BaseSelectRef } from "rc-select";
import Highlighter from "react-highlight-words";
import {
    LeftOutlined,
    RightOutlined,
    DeleteOutlined,
    EditOutlined,
    WalletOutlined,
    RiseOutlined,
    SearchOutlined,
    CheckOutlined,
    CloseOutlined,
} from "@ant-design/icons";
import Chart from "react-apexcharts";

import { IItem } from "../../../../interfaces";
import { ColumnType } from "antd/lib/table";

import "./control.css";
import d2lIntl from "d2l-intl";
import * as dayjs from "dayjs";
import { ColorModeContext } from "../../../../contexts/color-mode";

export interface PanelItem {
    key: number;
    description: string;
    value: number;
}

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
    editing: boolean;
    dataIndex: string;
    title: string;
    inputType: "number" | "text";
    record: PanelItem;
    index: number;
    children: React.ReactNode;
}

const genEditableCell = (
    inputNumberFormatter: (value: number | undefined) => string,
    inputNumberParser: (value: string | undefined) => number
) => {
    const EditableCell: React.FC<EditableCellProps> = ({
        editing,
        dataIndex,
        title,
        inputType,
        children,
        ...restProps
    }) => {
        const inputNode =
            inputType === "number" ? (
                <InputNumber min={0} formatter={inputNumberFormatter} parser={inputNumberParser} />
            ) : (
                <Input />
            );

        return (
            <td {...restProps}>
                {editing ? (
                    <Form.Item
                        name={dataIndex}
                        style={{ margin: 0 }}
                        rules={[
                            {
                                required: true,
                                message: `Please Input ${title}!`,
                            },
                        ]}
                    >
                        {inputNode}
                    </Form.Item>
                ) : (
                    children
                )}
            </td>
        );
    };
    return EditableCell;
};
interface MonthItemsCardProps {
    tableData: PanelItem[];
    locale: string;
    currency: string;
    symbol: string;
    initialSearch: string;
    autoCompleteOptions: { value: string }[];
    onAddItem: (description: string, value: number) => Promise<void>;
    onEditItem: (id: number, description: string, value: number) => Promise<void>;
    onDeleteItem: (itemId: number) => Promise<void>;
    onMonthItemCopy: (items: PanelItem[]) => Promise<void>;
    onBatchDelete: (itemIds: number[]) => Promise<void>;
    onSearch: (searchText: string) => Promise<void>;
}

export const MonthItemsCard: React.FC<MonthItemsCardProps> = ({
    initialSearch,
    autoCompleteOptions,
    tableData,
    locale,
    currency,
    symbol,
    onAddItem,
    onEditItem,
    onDeleteItem,
    onMonthItemCopy,
    onBatchDelete,
    onSearch,
}) => {
    const [addForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const descInputRef = useRef<BaseSelectRef>(null);

    // start selected rows
    const [selectedRows, setSelectedRows] = useState({
        keys: [] as React.Key[],
        rows: [] as PanelItem[],
    });

    const onSelectRowChange = (selectedRowKeys: React.Key[], selected: PanelItem[]) => {
        setSelectedRows({ keys: selectedRowKeys, rows: selected });
    };

    const rowSelection = {
        selectedRowKeys: selectedRows.keys,
        onChange: onSelectRowChange,
    };

    useEffect(() => {
        setSelectedRows({ keys: [], rows: [] });
    }, [tableData]);
    // end selected rows

    // start inputnumber formatter / parser
    const numFmt = useMemo(() => new d2lIntl.NumberFormat(locale, { maximumFractionDigits: 2 }), [locale]);
    const numParser = useMemo(() => new d2lIntl.NumberParse(locale), [locale]);

    const inputNumberFormatter = (value: number | undefined) => {
        const num = parseFloat(`${value}`);
        return Number.isNaN(num) ? "" : numFmt.format(num);
    };
    const inputNumberParser = (value: string | undefined) => (value ? numParser.parse(value) : 0);
    // end inputnumber formatter / parser

    // start of editable cells
    const [editingKey, setEditingKey] = useState("");

    const isEditing = (record: PanelItem) => `${record.key}` === editingKey;

    const edit = (record: Partial<PanelItem> & { key: React.Key }) => {
        editForm.setFieldsValue({ description: "", value: "", ...record });
        setEditingKey(`${record.key}`);
    };

    const cancel = () => setEditingKey("");

    // end of editable cells

    // start of filter components
    const searchInput = useRef<InputRef>(null);
    const [filterState, setFilterState] = useState({
        searchText: "",
        searchedColumn: "",
    });

    const handleSearch = (selectedKeys: React.Key[], confirm: () => void, dataIndex: string) => {
        confirm();
        setFilterState({
            searchText: `${selectedKeys[0]}`,
            searchedColumn: dataIndex,
        });
    };

    const handleReset = (clearFilters: (() => void) | undefined) => {
        if (clearFilters) clearFilters();
        setFilterState((state) => ({ ...state, searchText: "" }));
    };

    const currencyFormat = (value: number) => value.toLocaleString(locale, { style: "currency", currency: currency });

    const getColumnSearchProps = (dataIndex: string, format = false): ColumnType<PanelItem> => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
                <Input
                    ref={searchInput}
                    placeholder={`Search ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys, confirm, dataIndex)}
                    style={{ marginBottom: 8, display: "block" }}
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
        filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
        onFilter: (value: string | number | boolean, record: PanelItem) => {
            switch (dataIndex) {
                case "description":
                    return record.description.toLowerCase().includes(`${value}`.toLowerCase());
                case "value":
                    return `${record.value}`.toLowerCase().includes(`${value}`.toLowerCase());
                default:
                    return false;
            }
        },
        onFilterDropdownOpenChange: (visible) => {
            if (visible) {
                setTimeout(() => searchInput.current?.select(), 100);
            }
        },
        render: (text) => {
            const amount = format ? currencyFormat(text) : text;
            return filterState.searchedColumn === dataIndex ? (
                <Highlighter
                    highlightStyle={{ backgroundColor: "#ffc069", padding: 0 }}
                    searchWords={[filterState.searchText]}
                    autoEscape
                    textToHighlight={text ? amount : ""}
                />
            ) : (
                amount
            );
        },
    });
    // end of filter components
    const addItemOnEnter = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            addItem();
        }
    };

    const addItem = async () => {
        try {
            const { description, value } = await addForm.validateFields();
            await onAddItem(description, value);
            addForm.resetFields();
            descInputRef.current?.focus();
        } catch (errInfo) {
            console.error("Validate Failed:", errInfo);
        }
    };

    const editItem = async (key: number) => {
        try {
            const row = (await editForm.validateFields()) as PanelItem;
            await onEditItem(key, row.description, row.value);
        } catch (errInfo) {
            console.error("Validate Failed:", errInfo);
        } finally {
            setEditingKey("");
        }
    };

    const deleteItem = async (item: PanelItem) => {
        await onDeleteItem(item.key);
        addForm.resetFields();
    };

    const copyNextMonth = async () => {
        await onMonthItemCopy(selectedRows.rows);
    };

    const confirmDeleteSelected = () => {
        Modal.confirm({
            title: "Sure to delete all selected?",
            async onOk() {
                deleteSelected();
            },
        });
    };

    const deleteSelected = async () => {
        await onBatchDelete(selectedRows.rows.map((r) => r.key));
    };

    const columns = [
        {
            key: "description",
            title: "Description",
            dataIndex: "description",
            width: "60%",
            sorter: (a: PanelItem, b: PanelItem) => a.description.localeCompare(b.description),
            onCell: (record: PanelItem) => ({
                record,
                inputType: "text",
                dataIndex: "description",
                title: "Description",
                editing: isEditing(record),
            }),
            defaultFilteredValue: [initialSearch],
            ...getColumnSearchProps("description"),
        },
        {
            key: "value",
            title: "Value",
            dataIndex: "value",
            width: "20%",
            onCell: (record: PanelItem) => ({
                record,
                inputType: "number",
                dataIndex: "value",
                title: "Value",
                editing: isEditing(record),
            }),
            sorter: (a: PanelItem, b: PanelItem) => a.value - b.value,
            ...getColumnSearchProps("value", true),
        },
        {
            title: "Action",
            key: "operation",
            render: (record: PanelItem) => {
                const editable = isEditing(record);
                return (
                    <Space direction="horizontal" size={12}>
                        {editable ? (
                            <>
                                <Typography.Link onClick={() => editItem(record.key)} className="panel-confirm">
                                    <CheckOutlined />
                                </Typography.Link>
                                <Typography.Link onClick={cancel} className="panel-cancel">
                                    <CloseOutlined />
                                </Typography.Link>
                            </>
                        ) : (
                            <>
                                <Typography.Link
                                    disabled={editingKey !== ""}
                                    onClick={() => edit(record)}
                                    className="panel-edit"
                                >
                                    <EditOutlined />
                                </Typography.Link>
                                <Popconfirm title="Sure to delete?" onConfirm={() => deleteItem(record)}>
                                    <Typography.Link className="panel-delete">
                                        <DeleteOutlined />
                                    </Typography.Link>
                                </Popconfirm>
                            </>
                        )}
                    </Space>
                );
            },
        },
    ];

    return (
        <Card title="Month Items" bordered={false}>
            <Space direction="vertical" size={12} wrap style={{ width: "100%" }}>
                <Form form={addForm} layout="inline">
                    <Form.Item name="description" rules={[{ required: true }]}>
                        <AutoComplete
                            ref={descInputRef}
                            options={autoCompleteOptions}
                            onSearch={onSearch}
                            placeholder="Description"
                            style={{ width: 250 }}
                        />
                    </Form.Item>
                    <Form.Item name="value" rules={[{ required: true }]}>
                        <InputNumber
                            min={0}
                            prefix={`${symbol} `}
                            formatter={inputNumberFormatter}
                            parser={inputNumberParser}
                            placeholder="Value"
                            onKeyPress={addItemOnEnter}
                        />
                    </Form.Item>
                </Form>
                <Space direction="horizontal" size={12} wrap style={{ width: "100%" }}>
                    <Button type="primary" onClick={() => addItem()}>
                        Add Item
                    </Button>
                    <Button type="primary" disabled={selectedRows.keys.length === 0} onClick={() => copyNextMonth()}>
                        Replicate Next Month
                    </Button>
                    <Button
                        type="primary"
                        danger
                        disabled={selectedRows.keys.length === 0}
                        onClick={() => confirmDeleteSelected()}
                        className={"ant-btn-danger"}
                    >
                        Delete Selected
                    </Button>
                </Space>
                <Form form={editForm} component={false}>
                    <Table
                        components={{
                            body: {
                                cell: genEditableCell(inputNumberFormatter, inputNumberParser),
                            },
                        }}
                        rowSelection={rowSelection}
                        columns={columns}
                        dataSource={tableData}
                        size="small"
                        pagination={false}
                    />
                </Form>
            </Space>
        </Card>
    );
};

interface MonthStatsCardProps {
    tableData: IItem[];
    locale: string;
    currency: string;
}

export const MonthStatsCard: React.FC<MonthStatsCardProps> = ({ 
    tableData,
    locale,
    currency
 }) => {
    const { mode } = useContext(ColorModeContext);
    const { useToken } = theme;
    const { token } = useToken();

    const currencyFormat = (value: number) => value.toLocaleString(locale, { style: "currency", currency });

    const barChartConfig = {
        options: {
            chart: { id: "basic-bar", background: token.colorBgContainer },
            plotOptions: { bar: { horizontal: true } },
            dataLabels: { enabled: false, formatter: currencyFormat },
            colors: ["#77B6EA"],
            theme: { mode },
            tooltip: { y: { formatter: currencyFormat } },
            xaxis: { 
                categories: tableData.map((it) => it.description) ,
            },
        },
        series: [{ name: "value", data: tableData.map((it) => it.value) }],
    }

    return (
        <Card title="Month Stats" bordered={false}>
            <Chart options={barChartConfig.options} series={barChartConfig.series} type="bar" width="100%" />
        </Card>
    );
};

interface PeriodNavigationCardProps {
    format: string;
    value: dayjs.Dayjs;
    onValueChange: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
}

export const PeriodNavigationCard: React.FC<PeriodNavigationCardProps> = ({ value, format, onValueChange }) => {
    const onChangePeriod = (date: dayjs.Dayjs | null) => {
        if (date) onValueChange(date);
    };

    return (
        <Card title={"Period Navigation"} bordered={false}>
            <Space direction="horizontal" size={12}>
                <Typography.Link onClick={() => onValueChange((period) => period.clone().add(-1, "M"))} >
                    <LeftOutlined />
                </Typography.Link>
                <Typography.Link onClick={() => onValueChange((period) => period.clone().add(1, "M"))} >
                    <RightOutlined />
                </Typography.Link>
                <DatePicker value={value} format={format} onChange={onChangePeriod} picker="month" allowClear={false} />
            </Space>
        </Card>
    );
};

interface PeriodSummaryCardProps {
    total: number;
    difference: number;
    locale: string;
    symbol: string;
}

export const PeriodSummaryCard: React.FC<PeriodSummaryCardProps> = ({ total, difference, locale, symbol }) => {
    return (
        <Card title="Period Summary" bordered={false}>
            <Space direction="horizontal" size={32}>
                <Statistic
                    title="Monthly Cost"
                    value={total.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
                    valueStyle={{ color: "#3F8600" }}
                    prefix={<WalletOutlined />}
                    suffix={symbol}
                />
                <Statistic
                    title="Monthly Difference"
                    value={(100 * difference).toLocaleString(locale, {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 2,
                    })}
                    valueStyle={{ color: difference >= 0 ? "#3F8600" : "#F36565" }}
                    prefix={<RiseOutlined />}
                    suffix="%"
                />
            </Space>
        </Card>
    );
};
