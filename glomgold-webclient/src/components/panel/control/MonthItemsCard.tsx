import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AutoComplete,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  InputRef,
  Modal,
  Popconfirm,
  Space,
  Table,
  Typography,
} from "antd";
import { BaseSelectRef } from "rc-select";
import d2lIntl from "d2l-intl";
import { ColumnType } from "antd/lib/table";
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined, SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";

import "./item-card.css";
import { useCustom, useCustomMutation } from "@refinedev/core";

interface PanelItem {
  key: number;
  description: string;
  value: number;
}

interface ItemBody {
  period: string;
  description: string;
  value: number;
}

interface MonthItemsCardProps {
  formattedPeriod: string;
  tableData: PanelItem[];
  locale: string;
  currency: string;
  symbol: string;
  initialSearch: string;
  invalidateQuery: (period: string) => Promise<void>;
}

export const MonthItemsCard: React.FC<MonthItemsCardProps> = ({
  formattedPeriod,
  initialSearch,
  tableData,
  locale,
  currency,
  symbol,
  invalidateQuery,
}) => {
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const descInputRef = useRef<BaseSelectRef>(null);

  // start selected rows
  const [autoCompleteOptions, setAutoCompleteOptions] = useState<{ value: string }[]>([]);

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
      await addItem();
    }
  };

  const [searchText, setSearchText] = useState("");

  const { data: itemSearchData } = useCustom<string[]>({
    url: "/api/panel/item-complete",
    method: "get",
    config: { query: { description: searchText } },
  });

  const { mutate: onCreateUpdateItem } = useCustomMutation<ItemBody>();
  const { mutate: onMonthItemCopy } = useCustomMutation<ItemBody[]>();
  const { mutate: onDeleteItem } = useCustomMutation();

  const addItem = async () => {
    try {
      const row = (await addForm.validateFields()) as PanelItem;
      onCreateUpdateItem(
        {
          url: "/api/panel/add-item",
          method: "post",
          values: {
            description: row.description,
            value: row.value,
            period: formattedPeriod,
          },
        },
        {
          onSuccess: () => {
            addForm.resetFields();
            descInputRef.current?.focus();
            invalidateQuery(formattedPeriod);
          },
        }
      );
    } catch (errInfo) {
      console.error("Validate Failed:", errInfo);
    }
  };

  const editItem = async (key: number) => {
    try {
      const row = (await editForm.validateFields()) as PanelItem;
      onCreateUpdateItem(
        {
          url: `/api/panel/edit-item/${key}`,
          method: "patch",
          values: {
            description: row.description,
            value: row.value,
            period: formattedPeriod,
          },
        },
        {
          onSuccess: () => invalidateQuery(formattedPeriod),
          onSettled: () => setEditingKey(""),
        }
      );
    } catch (errInfo) {
      console.error("Validate Failed:", errInfo);
      setEditingKey("");
    }
  };

  const deleteItem = (item: PanelItem) => {
    onDeleteItem(
      {
        url: `/api/panel/remove-item/${item.key}`,
        method: "delete",
        values: {},
      },
      {
        onSuccess: () => {
          invalidateQuery(formattedPeriod)
          .then(() => addForm.resetFields());
        },
      }
    );
  };

  const copyNextMonth = () => {
    onMonthItemCopy({
      url: "/api/panel/copy-items",
      method: "post",
      values: selectedRows.rows.map((it) => ({
        period: formattedPeriod,
        description: it.description,
        value: it.value,
      })),
      successNotification: () => ({
        message: "Successfuly Operation",
        description: "Items were successfuly replicated to the next month",
        type: "success",
      }),
    });
  };

  const confirmDeleteSelected = () => {
    Modal.confirm({
      title: "Sure to delete all selected?",
      onOk() {
        deleteSelected();
      },
    });
  };

  const deleteSelected = () => {
    const itemIds = selectedRows.rows.map((r) => r.key).join(",");
    onDeleteItem(
      {
        url: `/api/panel/remove-items/${formattedPeriod}?ids=${itemIds}`,
        method: "delete",
        values: {},
      },
      {
        onSuccess: () => invalidateQuery(formattedPeriod),
      }
    );
  };

  const onSearch = () => {
    setAutoCompleteOptions((itemSearchData?.data ?? []).map((r) => ({ value: r })));
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
                <Typography.Link disabled={editingKey !== ""} onClick={() => edit(record)} className="panel-edit">
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
              value={searchText}
              onChange={setSearchText}
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
