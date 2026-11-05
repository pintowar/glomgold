import { useMemo } from "react";
import { useCustom, useTranslate } from "@refinedev/core";
import dayjs from "dayjs";
import { Calculator, LineChart as LineChartIcon, Table as TableIcon } from "lucide-react";

import { ItemChart } from "@/components/panel/report/ItemChart";
import { PeriodChart } from "@/components/panel/report/PeriodChart";
import { SummaryTable } from "@/components/panel/report/SummaryTable";
import { ItemTypeIcon } from "@/components/common/ItemTypeIcon";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectInput } from "@/components/common/form-fields";
import { YearPicker } from "@/components/common/period-pickers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { REPORT_TYPES, type ReportType } from "@/constants";
import { useIdentityDefaults } from "@/hooks/useIdentityDefaults";
import { usePanelAccounts } from "@/hooks/usePanelAccounts";
import { usePanelSearchParams } from "@/hooks/usePanelSearchParams";
import type { IPanelAnnualReport } from "@/interfaces";

const PERIOD_FORMAT = "YYYY";

export const ReportPanel = () => {
  const { locale, currency } = useIdentityDefaults();
  const translate = useTranslate();
  const { accounts } = usePanelAccounts();
  const { searchParams, updateSearchParams } = usePanelSearchParams();

  const period = searchParams.get("period") ?? dayjs().format(PERIOD_FORMAT);
  const type = (searchParams.get("type") ?? "BALANCE") as ReportType;
  const accountValue = searchParams.get("account");
  const accountId = accountValue ? Number(accountValue) : undefined;
  const byCategory = searchParams.get("byCategory") === "true";
  const year = dayjs(period, PERIOD_FORMAT).year();

  const {
    query: { isLoading },
    result,
  } = useCustom<IPanelAnnualReport>({
    url: "/api/panel/yearly-report",
    method: "get",
    config: { query: { year, type, accountId, byCategory } },
  });

  const typeOptions = useMemo(
    () => REPORT_TYPES.map((value) => ({ value, label: translate(`panel.report.type.${value.toLowerCase()}`, value) })),
    [translate]
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={translate("panel.report.navigation", "Report Navigation")} />
      <Card>
        <CardContent className="flex flex-wrap items-end gap-4">
          <YearPicker value={year} onChange={(next) => updateSearchParams({ period: `${next}` })} />
          <SelectInput
            label={translate("panel.report.type.label", "Type")}
            options={typeOptions}
            value={type}
            onChange={(value) => value && updateSearchParams({ type: `${value}` })}
          />
          <SelectInput
            label={translate("panel.account.label", "Account")}
            options={accounts.map((account) => ({ value: `${account.id}`, label: account.name }))}
            value={accountId}
            onChange={(value) => updateSearchParams({ account: value === undefined ? undefined : `${value}` })}
            allowClear
            placeholder={translate("panel.account.all", "All accounts")}
          />
          <div className="flex items-center gap-2 pb-2">
            <Switch
              data-testid="report-group-by-category"
              checked={byCategory}
              onCheckedChange={(checked) => updateSearchParams({ byCategory: checked ? "true" : undefined })}
            />
            <Label>{translate("panel.report.groupByCategory", " by category")}</Label>
          </div>
          <div className="flex items-center gap-2 pb-2 text-sm text-muted-foreground">
            {type === "BALANCE" ? <Calculator className="size-4" /> : <ItemTypeIcon type={type} />}
            {translate(`panel.report.type.${type.toLowerCase()}`, type)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{translate("panel.report.title", "Yearly Report")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-80 w-full" />
          ) : (
            <Tabs defaultValue="table">
              <TabsList>
                <TabsTrigger value="table">
                  <TableIcon className="size-4" />
                  {translate("panel.report.table", "Table")}
                </TabsTrigger>
                <TabsTrigger value="chart">
                  <LineChartIcon className="size-4" />
                  {translate("panel.report.chart", "Chart")}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="table">
                <SummaryTable
                  year={`${year}`}
                  locale={locale}
                  currency={currency}
                  columns={result?.data?.columns ?? []}
                  rowIndex={result?.data?.rowIndex ?? []}
                  data={result?.data?.data ?? []}
                  rowSummary={result?.data?.rowSummary ?? []}
                  colSummary={result?.data?.colSummary ?? []}
                  total={result?.data?.total ?? 0}
                />
              </TabsContent>
              <TabsContent value="chart" className="flex flex-col gap-6">
                <PeriodChart
                  cols={result?.data?.columns ?? []}
                  data={result?.data?.rowSummary ?? []}
                  trend={result?.data?.rowTrend ?? []}
                  locale={locale}
                  currency={currency}
                />
                <ItemChart
                  cols={result?.data?.rowIndex ?? []}
                  data={result?.data?.colAverage ?? []}
                  locale={locale}
                  currency={currency}
                />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
