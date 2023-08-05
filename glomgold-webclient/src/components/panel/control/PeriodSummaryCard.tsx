import React from "react";
import { Card, Space, Statistic } from "antd";
import { RiseOutlined, WalletOutlined } from "@ant-design/icons";

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
