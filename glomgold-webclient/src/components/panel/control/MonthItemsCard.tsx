import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  App as AntdApp,
  AutoComplete,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  InputRef,
  Popconfirm,
  RefSelectProps,
  Select,
  Space,
  Table,
  type TableColumnsType,
  Tooltip,
  Typography,
} from "antd";
import d2lIntl from "d2l-intl";
import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import Highlighter from "react-highlight-words";

import "./item-card.css";
import { useCustom, useCustomMutation } from "@refinedev/core";

interface PanelItem {
  key: number;
  description: string;
  itemType: "EXPENSE" | "INCOME";
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
  onSearchChange?: (value: string) => void;
  invalidateQuery: (period: string) => Promise<void>;
}

type EditableInputType = "number" | "text" | "select";

const ITEM_TYPE_OPTIONS = [
  { value: "EXPENSE", label: <ShoppingCartOutlined /> },
  { value: "INCOME", label: <DollarOutlined /> },
];

const INITIAL_FORM_VALUES = { itemType: "EXPENSE", description: "", value: 0 };

const HIGHLIGHT_STYLE = { backgroundColor: "#ffc069", padding: 0 };

// Single source of locale-aware number format/parse, shared by the add-form
// InputNumber and the editable table cells.
const useLocaleNumberFormat = (locale: string) =>
  useMemo(() => {
    const numFmt = new d2lIntl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const numParser = new d2lIntl.NumberParse(locale);
    return {
      formatter: (value: number | undefined) => {
        const num = parseFloat(`${value}`);
        return Number.isNaN(num) ? "" : numFmt.format(num);
      },
      parser: (value: string | undefined) => (value ? numParser.parse(value) : 0),
    };
  }, [locale]);

interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: EditableInputType;
  locale: string;
  children: React.ReactNode;
}

// Module-level so antd gets a stable component type across renders
// (a per-render factory would remount every cell, dropping edit focus).
const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  locale,
  children,
  ...restProps
}) => {
  const { formatter, parser } = useLocaleNumberFormat(locale);
  const inputNode =
    inputType === "number" ? (
      <InputNumber min={0} formatter={formatter} parser={parser} />
    ) : inputType === "select" ? (
      <Select options={ITEM_TYPE_OPTIONS} />
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

export const MonthItemsCard: React.FC<MonthItemsCardProps> = ({
  formattedPeriod,
  initialSearch,
  onSearchChange,
  tableData,
  locale,
  currency,
  symbol,
  invalidateQuery,
}) => {
  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const { modal } = AntdApp.useApp();
  const descInputRef = useRef<RefSelectProps>(null);
  const searchInput = useRef<InputRef>(null);

  const { formatter: inputNumberFormatter, parser: inputNumberParser } = useLocaleNumberFormat(locale);
  const currencyFormat = useCallback(
    (value: number) => value.toLocaleString(locale, { style: "currency", currency: currency }),
    [locale, currency]
  );

  // start selected rows
  const [selectedRows, setSelectedRows] = useState({
    keys: [] as React.Key[],
    rows: [] as PanelItem[],
  });

  const rowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedRows.keys,
      onChange: (selectedRowKeys: React.Key[], selected: PanelItem[]) => {
        setSelectedRows({ keys: selectedRowKeys, rows: selected });
      },
    }),
    [selectedRows.keys]
  );

  const [prevTableData, setPrevTableData] = useState(tableData);

  if (prevTableData !== tableData) {
    setPrevTableData(tableData);
    setSelectedRows({ keys: [], rows: [] });
  }
  // end selected rows

  // start of editable cells
  const [editingKey, setEditingKey] = useState("");

  const isEditing = (record: PanelItem) => `${record.key}` === editingKey;

  const edit = (record: Partial<PanelItem> & { key: React.Key }) => {
    editForm.setFieldsValue({ description: "", value: "", itemType: "EXPENSE", ...record });
    setEditingKey(`${record.key}`);
  };

  const cancel = () => setEditingKey("");

  const cellProps = (dataIndex: string, title: string, inputType: EditableInputType, record: PanelItem) => ({
    dataIndex,
    title,
    inputType,
    locale,
    editing: isEditing(record),
  });
  // end of editable cells

  // start of filter components
  // The URL (?desc=) is the source of truth for the description filter, so its
  // highlight derives directly from the prop — no sync state needed. The value
  // column filter is uncontrolled (antd-internal), so only its highlight is local.
  const descFilter = initialSearch ?? "";
  const [valueHighlight, setValueHighlight] = useState("");

  const applyColumnFilter = useCallback(
    (selectedKeys: React.Key[], confirmFilter: () => void, dataIndex: string) => {
      confirmFilter();
      const next = `${selectedKeys[0] ?? ""}`;
      if (dataIndex === "description") {
        onSearchChange?.(next);
      } else {
        setValueHighlight(next);
      }
    },
    [onSearchChange]
  );

  const resetColumnFilter = useCallback(
    (clearFilters: (() => void) | undefined, dataIndex: string) => {
      clearFilters?.();
      if (dataIndex === "description") {
        onSearchChange?.("");
      } else {
        setValueHighlight("");
      }
    },
    [onSearchChange]
  );

  const getColumnSearchProps = (dataIndex: string, format = false): TableColumnsType<PanelItem>[number] => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          // eslint-disable-next-line react-hooks/refs -- passing ref to antd Input is the documented table-filter pattern; ref is only read in event handlers
          ref={searchInput}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => applyColumnFilter(selectedKeys, confirm, dataIndex)}
          style={{ marginBottom: 8, display: "block" }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => applyColumnFilter(selectedKeys, confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Search
          </Button>
          <Button onClick={() => resetColumnFilter(clearFilters, dataIndex)} size="small" style={{ width: 90 }}>
            Reset
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => applyColumnFilter(selectedKeys, () => confirm({ closeDropdown: false }), dataIndex)}
          >
            Filter
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered) => <SearchOutlined style={{ color: filtered ? "#1890ff" : undefined }} />,
    onFilter: (value, record) => {
      const query = `${value}`.toLowerCase();
      const target = dataIndex === "description" ? record.description : `${record.value}`;
      return target.toLowerCase().includes(query);
    },
    filterDropdownProps: {
      onOpenChange: (open) => {
        if (open) {
          setTimeout(() => searchInput.current?.select(), 100);
        }
      },
    },
    render: (text) => {
      const display = format ? currencyFormat(text) : text;
      const query = dataIndex === "description" ? descFilter : valueHighlight;
      return query ? (
        <Highlighter
          highlightStyle={HIGHLIGHT_STYLE}
          searchWords={[query]}
          autoEscape
          textToHighlight={text ? display : ""}
        />
      ) : (
        display
      );
    },
  });

  // Backstop: keep ?desc= in sync when the description filter changes via the table itself.
  const handleTableChange = (_: unknown, filters: Record<string, (React.Key | boolean | null)[] | null>) => {
    const next = filters?.description?.[0] != null ? `${filters.description[0]}` : "";
    if (next !== descFilter) {
      onSearchChange?.(next);
    }
  };
  // end of filter components

  const [autocompleteQuery, setAutocompleteQuery] = useState("");

  const { result: itemSearchData } = useCustom<string[]>({
    url: "/api/panel/item-complete",
    method: "get",
    config: { query: { description: autocompleteQuery } },
    queryOptions: {
      enabled: autocompleteQuery.length >= 3,
    },
  });

  const autoCompleteOptions = useMemo(() => {
    // Refine v5 normalizes missing useCustom data to {} (not undefined), so guard with Array.isArray
    const data = itemSearchData?.data;
    return (Array.isArray(data) ? data : []).map((value) => ({ value }));
  }, [itemSearchData]);

  const { mutate: onCreateUpdateItem } = useCustomMutation<ItemBody>();
  const { mutate: onMonthItemCopy } = useCustomMutation<ItemBody[]>();
  const { mutate: onDeleteItem } = useCustomMutation();

  // Shared add/edit path: only the form, endpoint, and callbacks differ.
  const saveItem = async (
    source: typeof addForm,
    url: string,
    method: "post" | "patch",
    callbacks: { onSuccess?: () => void; onSettled?: () => void; onValidationError?: () => void } = {}
  ) => {
    let row: PanelItem;
    try {
      row = (await source.validateFields()) as PanelItem;
    } catch (errInfo) {
      console.error("Validate Failed:", errInfo);
      callbacks.onValidationError?.();
      return;
    }
    onCreateUpdateItem(
      {
        url,
        method,
        values: {
          period: formattedPeriod,
          description: row.description,
          value: row.value,
          itemType: row.itemType,
        },
      },
      {
        onSuccess: callbacks.onSuccess,
        onSettled: callbacks.onSettled,
      }
    );
  };

  const addItem = () =>
    saveItem(addForm, "/api/panel/add-item", "post", {
      onSuccess: () => {
        addForm.resetFields();
        descInputRef.current?.focus();
        void invalidateQuery(formattedPeriod);
      },
    });

  const editItem = (key: number) =>
    saveItem(editForm, `/api/panel/edit-item/${key}`, "patch", {
      onSuccess: () => {
        void invalidateQuery(formattedPeriod);
      },
      onSettled: () => setEditingKey(""),
      onValidationError: () => setEditingKey(""),
    });

  // Shared delete path: only the endpoint and the post-invalidation follow-up differ.
  const removeItems = (url: string, afterSuccess?: () => void) => {
    onDeleteItem(
      {
        url,
        method: "delete",
        values: {},
      },
      {
        onSuccess: () => {
          void invalidateQuery(formattedPeriod).then(() => afterSuccess?.());
        },
      }
    );
  };

  const deleteItem = (item: PanelItem) =>
    removeItems(`/api/panel/remove-item/${item.key}`, () => addForm.resetFields());

  const copyNextMonth = () => {
    onMonthItemCopy({
      url: "/api/panel/copy-items",
      method: "post",
      values: selectedRows.rows.map((it) => ({
        period: formattedPeriod,
        description: it.description,
        itemType: it.itemType,
        value: it.value,
      })),
      successNotification: () => ({
        message: "Successfuly Operation",
        description: "Items were successfuly replicated to the next month",
        type: "success",
      }),
    });
  };

  const deleteSelected = () => {
    const itemIds = selectedRows.rows.map((r) => r.key).join(",");
    removeItems(`/api/panel/remove-items/${formattedPeriod}?ids=${itemIds}`);
  };

  const confirmDeleteSelected = () => {
    // NOTE: use context-based modal — static Modal.confirm renders via rc-util's
    // legacy ReactDOM entry point, which silently no-ops under React 19
    modal.confirm({
      title: "Sure to delete all selected?",
      onOk() {
        deleteSelected();
      },
    });
  };

  const columns = [
    {
      key: "description",
      title: "Description",
      dataIndex: "description",
      width: "60%",
      sorter: (a: PanelItem, b: PanelItem) => a.description.localeCompare(b.description),
      onCell: (record: PanelItem) => cellProps("description", "Description", "text", record),
      ...getColumnSearchProps("description"),
      filteredValue: descFilter ? [descFilter] : null,
    },
    {
      key: "itemType",
      title: "Type",
      dataIndex: "itemType",
      width: "10%",
      onCell: (record: PanelItem) => cellProps("itemType", "Type", "select", record),
      sorter: (a: PanelItem, b: PanelItem) => a.itemType.localeCompare(b.itemType),
      render: (record: string) => (
        <Tooltip placement="left" title={record}>
          {record === "EXPENSE" ? <ShoppingCartOutlined /> : <DollarOutlined />}
        </Tooltip>
      ),
    },
    {
      key: "value",
      title: "Value",
      dataIndex: "value",
      width: "20%",
      onCell: (record: PanelItem) => cellProps("value", "Value", "number", record),
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
    <Card data-testid={"month-items-card"} title="Month Items" variant="borderless">
      <Space direction="vertical" size={12} wrap style={{ width: "100%" }}>
        <Form form={addForm} layout="inline" initialValues={INITIAL_FORM_VALUES}>
          <Form.Item data-testid={"itemType"} name="itemType">
            <Select options={ITEM_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="description" rules={[{ required: true }]}>
            <AutoComplete
              data-testid={"description"}
              ref={descInputRef}
              value={autocompleteQuery}
              onChange={setAutocompleteQuery}
              options={autoCompleteOptions}
              placeholder="Description"
              style={{ width: 250 }}
            />
          </Form.Item>
          <Form.Item name="value" rules={[{ required: true }]}>
            <InputNumber
              data-testid={"value"}
              min={0}
              prefix={`${symbol} `}
              formatter={inputNumberFormatter}
              parser={inputNumberParser}
              placeholder="Value"
              onKeyDown={(e) => {
                if (e.key === "Enter") void addItem();
              }}
            />
          </Form.Item>
        </Form>
        <Space direction="horizontal" size={12} wrap style={{ width: "100%" }}>
          <Button data-testid={"add-item"} type="primary" onClick={() => addItem()}>
            Add Item
          </Button>
          <Button
            data-testid={"replicate-month"}
            type="primary"
            disabled={selectedRows.keys.length === 0}
            onClick={() => copyNextMonth()}
          >
            Replicate Next Month
          </Button>
          <Button
            data-testid={"delete-selected"}
            type="primary"
            danger
            disabled={selectedRows.keys.length === 0}
            onClick={() => confirmDeleteSelected()}
          >
            Delete Selected
          </Button>
        </Space>
        <Form form={editForm} component={false}>
          <Table
            components={{
              body: {
                cell: EditableCell,
              },
            }}
            rowSelection={rowSelection}
            columns={columns}
            dataSource={tableData}
            size="small"
            pagination={false}
            onChange={handleTableChange}
          />
        </Form>
      </Space>
    </Card>
  );
};
