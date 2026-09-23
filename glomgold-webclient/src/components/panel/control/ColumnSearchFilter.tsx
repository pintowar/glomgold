import React, { useCallback } from "react";
import { Button, Input, type InputRef, Space, type TableColumnsType } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import Highlighter from "react-highlight-words";
import type { PanelItem } from "./types";

const HIGHLIGHT_STYLE = { backgroundColor: "#ffc069", padding: 0 };

interface ColumnSearchDeps {
  searchInput: React.RefObject<InputRef | null>;
  currencyFormat: (value: number) => string;
  descFilter: string;
  valueHighlight: string;
  applyColumnFilter: (selectedKeys: React.Key[], confirmFilter: () => void, dataIndex: string) => void;
  resetColumnFilter: (clearFilters: (() => void) | undefined, dataIndex: string) => void;
}

export const useColumnSearch = ({
  searchInput,
  currencyFormat,
  descFilter,
  valueHighlight,
  applyColumnFilter,
  resetColumnFilter,
}: ColumnSearchDeps) =>
  useCallback(
    (dataIndex: string, format = false): TableColumnsType<PanelItem>[number] => ({
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
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
    }),
    [searchInput, currencyFormat, descFilter, valueHighlight, applyColumnFilter, resetColumnFilter]
  );
