import React, { useMemo } from "react";

import { Row, Col, Card, Space, DatePicker, Tabs, Skeleton, Select } from "antd";
import { CalculatorOutlined, LineChartOutlined, TableOutlined } from "@ant-design/icons";

import dayjs from "dayjs";

import { ItemChart, PeriodChart, SummaryTable } from "../../../components/panel/report";
import { IPanelAnnualReport } from "../../../interfaces";
import { useCustom } from "@refinedev/core";
import { REPORT_TYPES, type ReportType } from "../../../constants";
import { ItemTypeIcon } from "../../../components/common/ItemTypeIcon";
import { useIdentityDefaults } from "../../../hooks/useIdentityDefaults";
import { usePanelSearchParams } from "../../../hooks/usePanelSearchParams";

export const ReportPanel: React.FC = () => {
  const { locale, currency } = useIdentityDefaults();
  const periodFormat = "YYYY";
  const periodParam = "period";
  const typeParam = "type";

  const { searchParams, updateSearchParams } = usePanelSearchParams();
  const period = searchParams.get(periodParam) ?? dayjs().format(periodFormat);
  const type = (searchParams.get(typeParam) ?? "BALANCE") as ReportType;

  const currentPeriod = useMemo(() => dayjs(period, periodFormat), [period, periodFormat]);

  const {
    query: { isLoading },

    result: dataTable,
  } = useCustom<IPanelAnnualReport>({
    url: `/api/panel/yearly-report`,
    method: "get",
    config: { query: { year: currentPeriod.year(), type } },
  });

  const onChangePeriod = (date: dayjs.Dayjs | null) => {
    if (date) {
      updateSearchParams({ [periodParam]: date.format(periodFormat) });
    }
  };

  const onTypeChange = (value: string) => {
    if (value) {
      updateSearchParams({ [typeParam]: value });
    }
  };

  const tabsItems = useMemo(
    () => [
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
    ],
    [currentPeriod, locale, currency, dataTable]
  );

  const typeOptions = useMemo(
    () =>
      REPORT_TYPES.map((value) => ({
        value,
        label: (
          <span>
            {value === "BALANCE" ? <CalculatorOutlined /> : <ItemTypeIcon type={value} />} - {value}
          </span>
        ),
      })),
    []
  );

  return (
    <>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title={"Report Navigation"} variant="borderless">
              <Row gutter={[16, 16]}>
                <Col>
                  <DatePicker value={currentPeriod} picker="year" onChange={onChangePeriod} allowClear={false} />
                </Col>
                <Col>
                  <Select value={type} onChange={onTypeChange} style={{ width: 160 }} options={typeOptions} />
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
            <Card variant="borderless">
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
