import React, { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCustom, useGetIdentity } from "@refinedev/core";

import { Row, Col, Spin } from "antd";
import dayjs from "dayjs";

import { IItem, ISummary } from "../../../interfaces";

import {
  PeriodSummaryCard,
  PeriodNavigationCard,
  MonthItemsCard,
  MonthStatsCard,
} from "../../../components/panel/control";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY, DEFAULT_SYMBOL } from "../../../constants";

interface ControlPanelData {
  items: IItem[];
  stats: IItem[];
  total: ISummary;
  diff: ISummary;
}

export const ControlPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: identity } = useGetIdentity<{ locale: string; currency: string; symbol: string }>();
  const locale = identity?.locale ?? DEFAULT_LOCALE;
  const currency = identity?.currency ?? DEFAULT_CURRENCY;
  const symbol = identity?.symbol ?? DEFAULT_SYMBOL;
  const controlPanelKey = "control-panel-key";
  const periodFormat = "YYYY-MM";
  const periodParam = "period";
  const descParam = "desc";

  const [searchParams, setSearchParams] = useSearchParams();
  const period = searchParams.get(periodParam) ?? dayjs().format(periodFormat);
  const desc = searchParams.get(descParam) ?? "";

  const currentPeriod = useMemo(() => dayjs(period, periodFormat), [period, periodFormat]);
  const formattedPeriod = useMemo(() => currentPeriod.format(periodFormat), [currentPeriod]);
  const onCurrentPeriodChange = (value: dayjs.Dayjs | null) => {
    value && setSearchParams({ [periodParam]: value.format(periodFormat) });
  };

  const { data: panelData, isLoading } = useCustom<ControlPanelData>({
    url: "/api/panel",
    method: "get",
    config: { query: { period: formattedPeriod } },
    queryOptions: {
      queryKey: [controlPanelKey, formattedPeriod],
    },
  });

  const invalidateQuery = async (period: string) => await queryClient.invalidateQueries([controlPanelKey, period]);

  const tableData = (panelData?.data?.items ?? []).map(({ id, description, value, itemType }) => ({
    key: id,
    description,
    itemType,
    value,
  }));

  return (
    <Spin spinning={isLoading}>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <PeriodNavigationCard value={currentPeriod} onValueChange={onCurrentPeriodChange} format={periodFormat} />
          </Col>
          <Col span={12}>
            <PeriodSummaryCard
              total={panelData?.data.total ?? 0}
              difference={panelData?.data.diff ?? 0}
              locale={locale}
              symbol={symbol}
            />
          </Col>
        </Row>
      </div>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <MonthItemsCard
              formattedPeriod={formattedPeriod}
              initialSearch={desc}
              tableData={tableData}
              locale={locale}
              currency={currency}
              symbol={symbol}
              invalidateQuery={invalidateQuery}
            />
          </Col>
          <Col span={12}>
            <MonthStatsCard tableData={panelData?.data.stats ?? []} locale={locale} currency={currency} />
          </Col>
        </Row>
      </div>
    </Spin>
  );
};
