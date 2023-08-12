import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { Row, Col, Card, Space, DatePicker, Tabs, Skeleton, Select } from "antd";
import {
  CalculatorOutlined,
  DollarOutlined,
  LineChartOutlined,
  ShoppingCartOutlined,
  TableOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import { ItemChart, PeriodChart, SummaryTable } from "../../../components/panel/report";
import { IPanelAnnualReport } from "../../../interfaces";
import { useCustom, useGetIdentity } from "@refinedev/core";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from "../../../constants";

export const ReportPanel: React.FC = () => {
  const { data: identity } = useGetIdentity<{ locale: string; currency: string }>();
  const locale = identity?.locale ?? DEFAULT_LOCALE;
  const currency = identity?.currency ?? DEFAULT_CURRENCY;
  const periodFormat = "YYYY";
  const periodParam = "period";
  const typeParam = "type";

  const [searchParams, setSearchParams] = useSearchParams();
  const period = searchParams.get(periodParam) ?? dayjs().format(periodFormat);
  const type = searchParams.get(typeParam) ?? "BALANCE";

  const currentPeriod = useMemo(() => dayjs(period, periodFormat), [period, periodFormat]);

  const { data: dataTable, isLoading } = useCustom<IPanelAnnualReport>({
    url: `/api/panel/report`,
    method: "get",
    config: { query: { year: currentPeriod.year(), type } },
  });

  const onChangePeriod = (date: dayjs.Dayjs | null) => {
    date &&
      setSearchParams((params) => {
        return { ...Object.fromEntries(params), [periodParam]: date.format(periodFormat) };
      });
  };

  const onTypeChange = (value: string) => {
    value &&
      setSearchParams((params) => {
        return { ...Object.fromEntries(params), [typeParam]: value };
      });
  };

  const tabsItems = [
    {
      key: "1",
      label: (
        <span>
          <TableOutlined />
          Table
        </span>
      ),
      children: (
        <SummaryTable
          year={currentPeriod.format(periodFormat)}
          locale={locale}
          currency={currency}
          columns={dataTable?.data.columns ?? []}
          rowIndex={dataTable?.data.rowIndex ?? []}
          data={dataTable?.data.data ?? []}
          rowSummary={dataTable?.data.rowSummary ?? []}
          colSummary={dataTable?.data.colSummary ?? []}
          total={dataTable?.data.total ?? 0}
        />
      ),
    },
    {
      key: "2",
      label: (
        <span>
          <LineChartOutlined />
          Chart
        </span>
      ),
      children: (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <PeriodChart
            cols={dataTable?.data.columns ?? []}
            data={dataTable?.data.rowSummary ?? []}
            trend={dataTable?.data.rowTrend ?? []}
            locale={locale}
            currency={currency}
          />
          <ItemChart
            cols={dataTable?.data.rowIndex ?? []}
            data={dataTable?.data.colAverage ?? []}
            locale={locale}
            currency={currency}
          />
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title={"Report Navigation"} bordered={false}>
              <Row gutter={[16, 16]}>
                <Col>
                  <DatePicker value={currentPeriod} picker="year" onChange={onChangePeriod} allowClear={false} />
                </Col>
                <Col>
                  <Select value={type} onChange={onTypeChange} style={{ width: 160 }}>
                    <Select.Option value={"BALANCE"}>
                      <CalculatorOutlined /> - BALANCE
                    </Select.Option>
                    <Select.Option value={"EXPENSE"}>
                      <ShoppingCartOutlined /> - EXPENSE
                    </Select.Option>
                    <Select.Option value={"INCOME"}>
                      <DollarOutlined /> - INCOME
                    </Select.Option>
                  </Select>
                </Col>
                <Col span={14} />
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card bordered={false}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                {!isLoading ? <Tabs type="card" items={tabsItems} /> : <Skeleton active />}
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};
