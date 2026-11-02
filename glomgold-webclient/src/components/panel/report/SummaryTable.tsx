import { useMemo } from "react";
import { Link } from "react-router";
import { useTranslate } from "@refinedev/core";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
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

export const SummaryTable = ({
  year,
  locale,
  currency,
  columns,
  rowIndex,
  data,
  rowSummary,
  colSummary,
  total,
}: SummaryTableProps) => {
  const translate = useTranslate();
  const formatCurrency = useCurrencyFormat(locale, currency);

  const cell = useMemo(
    () => (value: number | undefined, month?: number, description?: string) => {
      if (!value) return "";
      const color = value > 0 ? INCOME_COLOR : EXPENSE_COLOR;
      const label = formatCurrency(Math.abs(value));
      return month && description ? (
        <Link style={{ color }} to={`/panel?period=${year}-${`${month}`.padStart(2, "0")}&desc=${description}`}>
          {label}
        </Link>
      ) : (
        <span style={{ color }}>{label}</span>
      );
    },
    [formatCurrency, year]
  );

  const totalLabel = translate("panel.report.total", "Total");

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead />
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
            <TableHead>{totalLabel}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rowIndex.map((description, row) => (
            <TableRow key={`${description}-${row}`}>
              <TableCell>{description}</TableCell>
              {columns.map((column, index) => (
                <TableCell key={column}>{cell(data[row]?.[index], index + 1, description)}</TableCell>
              ))}
              <TableCell>{cell(colSummary[row])}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-semibold">{totalLabel}</TableCell>
            {rowSummary.map((value, index) => (
              <TableCell key={`summary-${index}`}>{cell(value)}</TableCell>
            ))}
            <TableCell className="font-semibold">{cell(total)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
