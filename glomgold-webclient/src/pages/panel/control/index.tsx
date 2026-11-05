import { useCallback, useMemo } from "react";
import { useCustom } from "@refinedev/core";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";

import { MonthItemsCard } from "@/components/panel/control/MonthItemsCard";
import { MonthStatsCard } from "@/components/panel/control/MonthStatsCard";
import { PeriodNavigationCard } from "@/components/panel/control/PeriodNavigationCard";
import { PeriodSummaryCard } from "@/components/panel/control/PeriodSummaryCard";
import type { PanelItem } from "@/components/panel/control/types";
import { PANEL_QUERY_KEYS, PANEL_URLS, PERIOD_FORMAT } from "@/constants";
import { useIdentityDefaults } from "@/hooks/useIdentityDefaults";
import { usePanelAccounts } from "@/hooks/usePanelAccounts";
import { usePanelSearchParams } from "@/hooks/usePanelSearchParams";
import type { IItem, ISummary } from "@/interfaces";

interface ControlPanelData {
  items: IItem[];
  stats: IItem[];
  total: ISummary;
  diff: ISummary;
}

const PERIOD_PARAM = "period";
const DESC_PARAM = "desc";
const ACCOUNT_PARAM = "account";

const EMPTY_SUMMARY: ISummary = { expense: 0, income: 0, balance: 0 };

export const ControlPanel = () => {
  const { locale, currency, symbol } = useIdentityDefaults();
  const { accounts, isLoading: isLoadingAccounts } = usePanelAccounts();
  const { searchParams, updateSearchParams } = usePanelSearchParams();

  const period = searchParams.get(PERIOD_PARAM) ?? dayjs().format(PERIOD_FORMAT);
  const desc = searchParams.get(DESC_PARAM) ?? "";
  const accountParam = searchParams.get(ACCOUNT_PARAM);

  // Default selection is the first account (backend returns them ordered by id asc).
  const accountId = useMemo(() => {
    if (accountParam) return Number(accountParam);
    return accounts.length > 0 ? accounts[0].id : undefined;
  }, [accountParam, accounts]);

  const formattedPeriod = useMemo(() => dayjs(period, PERIOD_FORMAT).format(PERIOD_FORMAT), [period]);

  const {
    query: { isLoading },
    result,
  } = useCustom<ControlPanelData>({
    url: PANEL_URLS.panel,
    method: "get",
    config: { query: { period: formattedPeriod, accountId } },
    queryOptions: {
      enabled: !isLoadingAccounts,
      queryKey: [PANEL_QUERY_KEYS.control, formattedPeriod, accountId],
    },
  });

  const tableData = useMemo<PanelItem[]>(
    () =>
      (result?.data?.items ?? []).map(({ id, description, value, itemType, origin, categoryId }) => ({
        key: id,
        description,
        itemType,
        value,
        origin,
        categoryId,
      })),
    [result?.data?.items]
  );

  const onCurrentPeriodChange = useCallback(
    (next: string) => updateSearchParams({ [PERIOD_PARAM]: next }),
    [updateSearchParams]
  );
  const onDescChange = useCallback(
    (next: string) => updateSearchParams({ [DESC_PARAM]: next || undefined }),
    [updateSearchParams]
  );
  const onAccountChange = useCallback(
    (next: number) => updateSearchParams({ [ACCOUNT_PARAM]: `${next}` }),
    [updateSearchParams]
  );

  return (
    <div className="relative flex flex-col gap-6">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-start justify-center bg-background/60 pt-24">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <PeriodNavigationCard
          value={formattedPeriod}
          onValueChange={onCurrentPeriodChange}
          locale={locale}
          accounts={accounts}
          accountId={accountId}
          onAccountChange={onAccountChange}
        />
        <PeriodSummaryCard
          total={result?.data?.total ?? EMPTY_SUMMARY}
          difference={result?.data?.diff ?? EMPTY_SUMMARY}
          locale={locale}
          symbol={symbol}
        />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <MonthItemsCard
          formattedPeriod={formattedPeriod}
          accountId={accountId}
          initialSearch={desc}
          onSearchChange={onDescChange}
          tableData={tableData}
          locale={locale}
          currency={currency}
        />
        <MonthStatsCard tableData={result?.data?.stats ?? []} locale={locale} currency={currency} />
      </div>
    </div>
  );
};
