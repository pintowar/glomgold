import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  App as AntdApp,
  AutoComplete,
  Button,
  Card,
  Form,
  InputNumber,
  InputRef,
  Popconfirm,
  RefSelectProps,
  Select,
  Space,
  Table,
  Tooltip,
  Typography,
} from "antd";
import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

import "./item-card.css";
import { useCustom } from "@refinedev/core";
import { PANEL_URLS, type ItemType } from "../../../constants";
import { ItemTypeIcon } from "../../common/ItemTypeIcon";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";
import { useLocaleNumberFormat } from "../../../hooks/useLocaleNumberFormat";
import { EditableCell, type EditableInputType, ITEM_TYPE_OPTIONS } from "./EditableCell";
import { useColumnSearch } from "./ColumnSearchFilter";
import { useMonthItemsMutations } from "./useMonthItemsMutations";
import type { PanelItem } from "./types";

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

const INITIAL_FORM_VALUES = { itemType: "EXPENSE", description: "", value: 0 };

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
  const currencyFormat = useCurrencyFormat(locale, currency);

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

  const edit = useCallback(
    (record: Partial<PanelItem> & { key: React.Key }) => {
      editForm.setFieldsValue({ description: "", value: "", itemType: "EXPENSE", ...record });
      setEditingKey(`${record.key}`);
    },
    [editForm]
  );

  const cancel = useCallback(() => setEditingKey(""), []);

  const cellProps = useCallback(
    (dataIndex: string, title: string, inputType: EditableInputType, record: PanelItem) => ({
      dataIndex,
      title,
      inputType,
      locale,
      editing: `${record.key}` === editingKey,
    }),
    [locale, editingKey]
  );
  // end of editable cells

  // start of filter components
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

  const getColumnSearchProps = useColumnSearch({
    searchInput,
    currencyFormat,
    descFilter,
    valueHighlight,
    applyColumnFilter,
    resetColumnFilter,
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
    url: PANEL_URLS.itemComplete,
    method: "get",
    config: { query: { description: autocompleteQuery } },
    queryOptions: {
      enabled: autocompleteQuery.length >= 3,
    },
  });

  const autoCompleteOptions = useMemo(() => {
    const data = itemSearchData?.data;
    return (Array.isArray(data) ? data : []).map((value) => ({ value }));
  }, [itemSearchData]);

  const { addItem, editItem, deleteItem, copyNextMonth, confirmDeleteSelected } = useMonthItemsMutations({
    formattedPeriod,
    addForm,
    editForm,
    selectedRows,
    invalidateQuery,
    modal,
    setEditingKey,
    focusDescription: () => descInputRef.current?.focus(),
  });

  const columns = useMemo(
    () => [
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
            <ItemTypeIcon type={record as ItemType} />
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
    ],
    // All callbacks above are memoized (cellProps, useColumnSearch, edit/cancel,
    // useMonthItemsMutations), so columns only rebuild when their inputs change.
    [cellProps, getColumnSearchProps, descFilter, editingKey, edit, cancel, editItem, deleteItem]
  );

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
