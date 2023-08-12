import React from "react";
import { Card, Space, Statistic, Tabs } from "antd";
import {
  FallOutlined,
  RiseOutlined,
  CalculatorOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { ISummary } from "../../../interfaces";
import { BALANCE_COLOR, EXPENSE_COLOR, INCOME_COLOR, DOWN_COLOR, UP_COLOR } from "../../../constants";

interface PeriodSummaryTabProps {
  desc: "Balance" | "Expense" | "Income";
  total: number | null;
  difference: number;
  locale: string;
  symbol: string;
}

const PeriodSummaryTab: React.FC<PeriodSummaryTabProps> = ({ desc, total, difference, locale, symbol }) => {
  const color = desc === "Expense" ? EXPENSE_COLOR : desc === "Income" ? INCOME_COLOR : BALANCE_COLOR;
  const icon =
    desc === "Expense" ? <ShoppingCartOutlined /> : desc === "Income" ? <DollarOutlined /> : <CalculatorOutlined />;

  return (
    <Space direction="horizontal" size={32}>
      <Statistic
        title={`Monthly ${desc}`}
        value={(total ?? 0).toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
        valueStyle={{ color }}
        prefix={icon}
        suffix={symbol}
      />
      <Statistic
        title="Monthly Percent Diff"
        value={(100 * difference).toLocaleString(locale, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2,
        })}
        valueStyle={{ color: difference >= 0 ? UP_COLOR : DOWN_COLOR }}
        prefix={difference >= 0 ? <RiseOutlined /> : <FallOutlined />}
        suffix="%"
      />
    </Space>
  );
};

interface PeriodSummaryCardProps {
  total: ISummary;
  difference: ISummary;
  locale: string;
  symbol: string;
}

export const PeriodSummaryCard: React.FC<PeriodSummaryCardProps> = ({ total, difference, locale, symbol }) => {
  return (
    <Card title="Period Summary" bordered={false}>
      <Tabs
        type="line"
        items={[
          {
            label: "Balance",
            key: "balance",
            children: (
              <PeriodSummaryTab
                desc="Balance"
                total={total.balance}
                difference={difference.balance}
                locale={locale}
                symbol={symbol}
              />
            ),
          },
          {
            label: "Expense",
            key: "expense",
            children: (
              <PeriodSummaryTab
                desc="Expense"
                total={total.expense}
                difference={difference.expense}
                locale={locale}
                symbol={symbol}
              />
            ),
          },
          {
            label: "Income",
            key: "income",
            children: (
              <PeriodSummaryTab
                desc="Income"
                total={total.income}
                difference={difference.income}
                locale={locale}
                symbol={symbol}
              />
            ),
          },
        ]}
      />
    </Card>
  );
};
