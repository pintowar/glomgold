import * as dayjs from "dayjs";
import React from "react";
import { useTranslate } from "@refinedev/core";
import { Card, DatePicker, Select, Space, Typography } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

import type { IAccount } from "../../../interfaces";

interface PeriodNavigationCardProps {
  format: string;
  value: dayjs.Dayjs;
  // onValueChange: React.Dispatch<React.SetStateAction<dayjs.Dayjs>>;
  onValueChange: (date: dayjs.Dayjs) => void;
  accounts?: IAccount[];
  accountId?: number;
  onAccountChange?: (accountId: number) => void;
}

export const PeriodNavigationCard: React.FC<PeriodNavigationCardProps> = ({
  value,
  format,
  onValueChange,
  accounts,
  accountId,
  onAccountChange,
}) => {
  const translate = useTranslate();
  const onChangePeriod = (date: dayjs.Dayjs | null) => {
    if (date) onValueChange(date);
  };

  return (
    <Card
      title={translate("panel.periodNavigation.title", "Period Navigation")}
      variant="borderless"
      extra={
        accounts ? (
          <Select
            data-testid={"account-filter"}
            value={accountId}
            onChange={(value: number) => onAccountChange?.(value)}
            options={accounts.map((account) => ({ value: account.id, label: account.name }))}
            placeholder={translate("panel.account.label", "Account")}
            style={{ minWidth: 160 }}
          />
        ) : undefined
      }
    >
      <Space direction="horizontal" size={12}>
        <Typography.Link data-testid={"navigate-left"} onClick={() => onValueChange(value.clone().add(-1, "M"))}>
          <LeftOutlined />
        </Typography.Link>
        <Typography.Link data-testid={"navigate-right"} onClick={() => onValueChange(value.clone().add(1, "M"))}>
          <RightOutlined />
        </Typography.Link>
        <DatePicker value={value} format={format} onChange={onChangePeriod} picker="month" allowClear={false} />
      </Space>
    </Card>
  );
};
