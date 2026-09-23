import React, { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Table, Typography } from "antd";
import { EXPENSE_COLOR, INCOME_COLOR } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";

interface SummaryTableProps {
  year: string;
  locale: string;
  currency: string;
  columns: string[];
  rowIndex: string[];
  data: number[][];
  rowSummary: number[];
  colSummary: number[];
  total: number;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  year,
  locale,
  currency,
  columns,
  rowIndex,
  data,
  rowSummary,
  colSummary,
  total,
}) => {
  const formatCurrency = useCurrencyFormat(locale, currency);
  const currencyFormatFactory = useCallback(
    (month?: number, desc?: string) => {
      const currencyFormat = (value?: number) => {
        const valueFormat = value ? formatCurrency(Math.abs(value)) : "";
        const color = (value || 0) > 0 ? INCOME_COLOR : EXPENSE_COLOR;
        if (month && desc) {
          const formattedMonth = `${month}`.padStart(2, "0");
          return (
            <Link style={{ color }} to={`/panel?period=${year}-${formattedMonth}&desc=${desc}`}>
              {valueFormat}
            </Link>
          );
        } else {
          return <Typography style={{ color }}>{valueFormat}</Typography>;
        }
      };
      return currencyFormat;
    },
    [year, formatCurrency]
  );

  const currencyFormat = useMemo(() => currencyFormatFactory(), [currencyFormatFactory]);

  const tableCols = useMemo(
    () =>
      [{ title: "", dataIndex: "desc", key: "desc", render: (value?: number) => <>{value}</> }]
        .concat(
          columns.map((col: string) => ({
            title: col,
            dataIndex: col,
            key: col,
            render: (value?: number) => <>{value}</>,
          }))
        )
        .concat([{ title: "Total", dataIndex: "total", key: "total", render: currencyFormatFactory() }]),
    [columns, currencyFormatFactory]
  );

  const source = useMemo(
    () =>
      rowIndex.map((desc, row) => {
        const summary = { key: row, desc: desc, total: colSummary[row] };
        const dataCols = columns.reduce((acc, col, idx) => {
          const cell = data[row][idx];
          const formattedCell = cell ? currencyFormatFactory(idx + 1, desc)(cell) : cell;
          return { [col]: formattedCell, ...acc };
        }, {});

        return { ...dataCols, ...summary };
      }),
    [rowIndex, columns, data, colSummary, currencyFormatFactory]
  );

  const summaryCells = useMemo(
    () => (
      <Table.Summary.Row>
        <Table.Summary.Cell key={"summary-total"} index={0}>
          <strong>Total</strong>
        </Table.Summary.Cell>
        {rowSummary.map((it, idx) => (
          <Table.Summary.Cell key={`summary-${idx + 1}`} index={idx}>
            {currencyFormat(it)}
          </Table.Summary.Cell>
        ))}
        <Table.Summary.Cell key={`summary-${rowSummary.length + 1}`} index={rowSummary.length + 1}>
          <strong>{currencyFormat(total)}</strong>
        </Table.Summary.Cell>
      </Table.Summary.Row>
    ),
    [rowSummary, total, currencyFormat]
  );

  return (
    <Table
      columns={tableCols}
      dataSource={source}
      size="small"
      pagination={false}
      bordered
      summary={() => <Table.Summary fixed>{summaryCells}</Table.Summary>}
    />
  );
};
