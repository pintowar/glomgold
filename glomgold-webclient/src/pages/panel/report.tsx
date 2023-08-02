import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Row, Col, Card, Space, DatePicker, Tabs } from "antd";

import * as dayjs from "dayjs";

import { ItemChart, PeriodChart, AnnualTable } from "./components/report";
import { IPanelAnnualReport } from "../../interfaces";
import { useGetIdentity } from "@refinedev/core";
import { DEFAULT_LOCALE, DEFAULT_CURRENCY } from "../../constants";
import { axiosInstance } from "../../authProvider";

export const ReportPanel: React.FC = () => {
  const { data: identity } = useGetIdentity<{ locale: string; currency: string }>();
  const locale = identity?.locale || DEFAULT_LOCALE;
  const currency = identity?.currency || DEFAULT_CURRENCY;

  const periodFormat = "YYYY";
  const location = useLocation();
  const navigate = useNavigate();
  const period = new URLSearchParams(location.search).get("period") || dayjs().format(periodFormat);

  const [currentPeriod, setCurrentPeriod] = useState(dayjs(period, periodFormat));
  const [dataTable, setDataTable] = useState<IPanelAnnualReport>({
    columns: [],
    rowIndex: [],
    data: [],
    rowSummary: [],
    rowTrend: [],
    colSummary: [],
    colAverage: [],
    total: 0,
  });

  const onChangePeriod = (date: dayjs.Dayjs | null) => {
    if (date) setCurrentPeriod(date);
  };

  const tabsItems = [
    {
      key: "1",
      label: "Table",
      children: (
        <AnnualTable
          year={currentPeriod.format(periodFormat)}
          locale={locale}
          currency={currency}
          columns={dataTable.columns}
          rowIndex={dataTable.rowIndex}
          data={dataTable.data}
          rowSummary={dataTable.rowSummary}
          colSummary={dataTable.colSummary}
          total={dataTable.total}
        />
      ),
    },
    {
      key: "2",
      label: "Chart",
      children: (
        <Space direction="vertical" size={12} style={{ width: "100%" }}>
          <PeriodChart
            cols={dataTable.columns}
            data={dataTable.rowSummary}
            trend={dataTable.rowTrend}
            locale={locale}
            currency={currency}
          />
          <ItemChart cols={dataTable.rowIndex} data={dataTable.colAverage} locale={locale} currency={currency} />
        </Space>
      ),
    },
  ];

  useEffect(() => {
    const populateData = async () => {
      const { status, data } = await axiosInstance.get(`/api/panel/report?year=${currentPeriod.year()}`);
      if (status === 200) {
        setDataTable({ ...data });
        navigate(`/panel/report?period=${currentPeriod.format(periodFormat)}`);
      } else throw Error();
    };

    populateData();
  }, [currentPeriod, navigate]);

  return (
    <>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title={"Report Navigation"} bordered={false}>
              <DatePicker value={currentPeriod} picker="year" onChange={onChangePeriod} allowClear={false} />
            </Card>
          </Col>
        </Row>
      </div>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card bordered={false}>
              <Space direction="vertical" size={12} style={{ width: "100%" }}>
                <Tabs type="card" items={tabsItems} />
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );
};
