import React, { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCustom, useGetIdentity } from "@refinedev/core";

import { Row, Col, notification } from "antd";
import dayjs from "dayjs";

import { IItem } from "../../../interfaces";

import {
  PeriodSummaryCard,
  PeriodNavigationCard,
  MonthItemsCard,
  MonthStatsCard,
  PanelItem,
} from "../../../components/panel/control";

import { DEFAULT_LOCALE, DEFAULT_CURRENCY, DEFAULT_SYMBOL } from "../../../constants";
import { axiosInstance } from "../../../authProvider";

interface ControlPanelData {
  items: IItem[];
  stats: IItem[];
  total: number;
  diff: number;
}

export const ControlPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: identity } = useGetIdentity<{ locale: string; currency: string; symbol: string }>();
  const locale = identity?.locale || DEFAULT_LOCALE;
  const currency = identity?.currency || DEFAULT_CURRENCY;
  const symbol = identity?.symbol || DEFAULT_SYMBOL;
  const controlPanelKey = "control-panel-key";
  const periodFormat = "YYYY-MM";
  const periodParam = "period";
  const descParam = "desc";

  const [searchParams, setSearchParams] = useSearchParams();
  const period = searchParams.get(periodParam) || dayjs().format(periodFormat);
  const desc = searchParams.get(descParam) || "";

  const [autoCompleteOptions, setAutoCompleteOptions] = useState<{ value: string }[]>([]);
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

  const onAddItem = async (description: string, value: number) => {
    const { status, data } = await axiosInstance.post("/api/panel/add-item", {
      description,
      value,
      period: formattedPeriod,
    });
    if (status === 200) {
        await queryClient.invalidateQueries([controlPanelKey, formattedPeriod])
    } else throw Error();
  };

  const onEditItem = async (id: number, description: string, value: number) => {
    const { status, data } = await axiosInstance.patch(`/api/panel/edit-item/${id}`, {
      description,
      value,
      period: formattedPeriod,
    });
    if (status === 200) {
        await queryClient.invalidateQueries([controlPanelKey, formattedPeriod])
    } else throw Error();
  };

  const onDeleteItem = async (itemId: number) => {
    const { status, data } = await axiosInstance.delete(`/api/panel/remove-item/${itemId}`);
    if (status === 200) {
        await queryClient.invalidateQueries([controlPanelKey, formattedPeriod])
    } else throw Error();
  };

  const onBatchDelete = async (itemIds: number[]) => {
    const { status, data } = await axiosInstance.delete(
      `/api/panel/remove-items/${formattedPeriod}?ids=${itemIds.join(",")}`
    );
    if (status === 200) {
        await queryClient.invalidateQueries([controlPanelKey, formattedPeriod])
    } else throw Error();
  };

  const onMonthItemCopy = async (items: PanelItem[]) => {
    const itemsWithPeriod = items.map((it) => ({ ...it, period: formattedPeriod }));

    const { status } = await axiosInstance.post(`/api/panel/copy-items`, itemsWithPeriod);
    if (status !== 200) {
      throw Error();
    } else {
      notification["success"]({
        message: "Successfuly Operation",
        description: "Items were successfuly replicated to the next month",
      });
    }
  };

  const onSearch = async (searchText: string) => {
    const { status, data } = await axiosInstance.get<string[]>(`/api/panel/item-complete?description=${searchText}`);
    if (status !== 200) {
      throw Error();
    } else {
      setAutoCompleteOptions(data.map((r) => ({ value: r })));
    }
  };

  const tableData = (panelData?.data?.items || []).map(({ id, description, value }) => ({ key: id, description, value }));

  return (
    <>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <PeriodNavigationCard value={currentPeriod} onValueChange={onCurrentPeriodChange} format={periodFormat} />
          </Col>
          <Col span={12}>
            <PeriodSummaryCard total={panelData?.data.total || 0} difference={panelData?.data.diff || 0} locale={locale} symbol={symbol} />
          </Col>
        </Row>
      </div>
      <div className="card-row">
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <MonthItemsCard
              autoCompleteOptions={autoCompleteOptions}
              initialSearch={desc}
              tableData={tableData}
              locale={locale}
              currency={currency}
              symbol={symbol}
              onSearch={onSearch}
              onAddItem={onAddItem}
              onDeleteItem={onDeleteItem}
              onEditItem={onEditItem}
              onMonthItemCopy={onMonthItemCopy}
              onBatchDelete={onBatchDelete}
            />
          </Col>
          <Col span={12}>
            <MonthStatsCard tableData={panelData?.data.stats || []} locale={locale} currency={currency} />
          </Col>
        </Row>
      </div>
    </>
  );
};
