import React, { useCallback, useMemo } from "react";
import { useCustom } from "@refinedev/core";

import { Row, Col, Spin } from "antd";
import dayjs from "dayjs";

import { IItem, ISummary } from "../../../interfaces";
import { PANEL_QUERY_KEYS } from "../../../constants";

import {
  PeriodSummaryCard,
  PeriodNavigationCard,
  MonthItemsCard,
  MonthStatsCard,
} from "../../../components/panel/control";

import { useIdentityDefaults } from "../../../hooks/useIdentityDefaults";
import { usePanelSearchParams } from "../../../hooks/usePanelSearchParams";

interface ControlPanelData {
  items: IItem[];
  stats: IItem[];
  total: ISummary;
  diff: ISummary;
}

const PERIOD_FORMAT = "YYYY-MM";
const PERIOD_PARAM = "period";
const DESC_PARAM = "desc";

const EMPTY_SUMMARY: ISummary = { expense: 0, income: 0, balance: 0 };

export const ControlPanel: React.FC = () => {
  const { locale, currency, symbol } = useIdentityDefaults();

  const { searchParams, updateSearchParams } = usePanelSearchParams();
  const period = searchParams.get(PERIOD_PARAM) ?? dayjs().format(PERIOD_FORMAT);
  const desc = searchParams.get(DESC_PARAM) ?? "";

  const onCurrentPeriodChange = useCallback(
    (value: dayjs.Dayjs | null) => {
      if (value) {
        updateSearchParams({ [PERIOD_PARAM]: value.format(PERIOD_FORMAT) });
      }
    },
    [updateSearchParams]
  );

  const onDescChange = useCallback(
    (value: string) => {
      updateSearchParams({ [DESC_PARAM]: value || undefined });
    },
    [updateSearchParams]
  );

  const currentPeriod = useMemo(() => dayjs(period, PERIOD_FORMAT), [period]);
  const formattedPeriod = currentPeriod.format(PERIOD_FORMAT);

  const {
    query: { isLoading },
    result: panelData,
  } = useCustom<ControlPanelData>({
    url: "/api/panel",
    method: "get",
    config: { query: { period: formattedPeriod } },
    queryOptions: {
      queryKey: [PANEL_QUERY_KEYS.control, formattedPeriod],
    },
  });

  const tableData = useMemo(
    () =>
      (panelData?.data?.items ?? []).map(({ id, description, value, itemType }) => ({
        key: id,
        description,
        itemType,
        value,
      })),
    [panelData?.data?.items]
  );

  return (
    <Spin spinning={isLoading}>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <PeriodNavigationCard value={currentPeriod} onValueChange={onCurrentPeriodChange} format={PERIOD_FORMAT} />
          </Col>
          <Col span={12}>
            <PeriodSummaryCard
              total={panelData?.data.total ?? EMPTY_SUMMARY}
              difference={panelData?.data.diff ?? EMPTY_SUMMARY}
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
              onSearchChange={onDescChange}
              tableData={tableData}
              locale={locale}
              currency={currency}
              symbol={symbol}
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
