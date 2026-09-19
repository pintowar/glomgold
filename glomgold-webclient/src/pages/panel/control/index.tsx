import React, { useCallback, useMemo } from "react";
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

interface ControlPanelIdentity {
  locale: string;
  currency: string;
  symbol: string;
}

const CONTROL_PANEL_KEY = "control-panel-key";
const PERIOD_FORMAT = "YYYY-MM";
const PERIOD_PARAM = "period";
const DESC_PARAM = "desc";

const EMPTY_SUMMARY: ISummary = { expense: 0, income: 0, balance: 0 };

export const ControlPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: identity } = useGetIdentity<ControlPanelIdentity>();
  const locale = identity?.locale ?? DEFAULT_LOCALE;
  const currency = identity?.currency ?? DEFAULT_CURRENCY;
  const symbol = identity?.symbol ?? DEFAULT_SYMBOL;

  const [searchParams, setSearchParams] = useSearchParams();
  const period = searchParams.get(PERIOD_PARAM) ?? dayjs().format(PERIOD_FORMAT);
  const desc = searchParams.get(DESC_PARAM) ?? "";

  // Single merge point for URL params: set a value, or pass undefined to drop it.
  const updateSearchParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      setSearchParams((params) => {
        const next = { ...Object.fromEntries(params) };
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) {
            delete next[key];
          } else {
            next[key] = value;
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

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
      queryKey: [CONTROL_PANEL_KEY, formattedPeriod],
    },
  });

  const invalidateQuery = useCallback(
    (period: string) => queryClient.invalidateQueries({ queryKey: [CONTROL_PANEL_KEY, period] }),
    [queryClient]
  );

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
