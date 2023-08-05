import * as dayjs from "dayjs";
import React from "react";
import { Card, DatePicker, Space, Typography } from "antd";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";

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
        <Typography.Link onClick={() => onValueChange((period) => period.clone().add(-1, "M"))}>
          <LeftOutlined />
        </Typography.Link>
        <Typography.Link onClick={() => onValueChange((period) => period.clone().add(1, "M"))}>
          <RightOutlined />
        </Typography.Link>
        <DatePicker value={value} format={format} onChange={onChangePeriod} picker="month" allowClear={false} />
      </Space>
    </Card>
  );
};
