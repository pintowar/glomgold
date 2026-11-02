import { useCustom, useTranslate } from "@refinedev/core";
import { Calculator, DollarSign, ShoppingCart } from "lucide-react";

import { HeatMapChart } from "@/components/panel/report/HeatMapChart";
import { YearChart } from "@/components/panel/report/YearChart";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectInput } from "@/components/common/form-fields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BALANCE_COLOR, EXPENSE_COLOR, INCOME_COLOR } from "@/constants";
import { useIdentityDefaults } from "@/hooks/useIdentityDefaults";
import { usePanelAccounts } from "@/hooks/usePanelAccounts";
import { usePanelSearchParams } from "@/hooks/usePanelSearchParams";
import type { IPanelOverallReport } from "@/interfaces";

const KpiCard = ({
  title,
  value,
  color,
  icon,
  locale,
  symbol,
  extra,
}: {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  locale: string;
  symbol: string;
  extra?: string;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <p className="flex items-center gap-1 text-2xl font-semibold" style={{ color }}>
        {icon}
        {value.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
        <span className="text-base font-normal">{symbol}</span>
      </p>
      {extra && <p className="text-xs opacity-70" style={{ color }}>{extra}</p>}
    </CardContent>
  </Card>
);

export const OverallReportPanel = () => {
  const { locale, currency, symbol } = useIdentityDefaults();
  const translate = useTranslate();
  const { searchParams, updateSearchParams } = usePanelSearchParams();
  const { accounts } = usePanelAccounts();

  const accountValue = searchParams.get("account");
  const accountId = accountValue ? Number(accountValue) : undefined;

  const {
    query: { isLoading },
    result: report,
  } = useCustom<IPanelOverallReport>({
    url: "/api/panel/overall-report",
    method: "get",
    config: { query: { accountId } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={translate("panel.overall.title", "Overall Report")} />
      <Card>
        <CardContent>
          <SelectInput
            label={translate("panel.account.label", "Account")}
            options={accounts.map((account) => ({ value: `${account.id}`, label: account.name }))}
            value={accountId}
            onChange={(value) => updateSearchParams({ account: value === undefined ? undefined : `${value}` })}
            allowClear
            placeholder={translate("panel.account.all", "All accounts")}
          />
        </CardContent>
      </Card>

      {isLoading ? (
        <Skeleton className="h-80 w-full" />
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              title={translate("panel.overall.totalSpent", "Total Spent")}
              value={report?.data?.totalExpense ?? 0}
              color={EXPENSE_COLOR}
              icon={<ShoppingCart className="size-5" />}
              locale={locale}
              symbol={symbol}
            />
            <KpiCard
              title={translate("panel.overall.totalEarned", "Total Earned")}
              value={report?.data?.totalIncome ?? 0}
              color={INCOME_COLOR}
              icon={<DollarSign className="size-5" />}
              locale={locale}
              symbol={symbol}
            />
            <KpiCard
              title={translate("panel.overall.netBalance", "Net Balance")}
              value={report?.data?.totalBalance ?? 0}
              color={BALANCE_COLOR}
              icon={<Calculator className="size-5" />}
              locale={locale}
              symbol={symbol}
            />
            <KpiCard
              title={translate("panel.overall.avgMonthlyExpense", "Avg Monthly Expense")}
              value={report?.data?.avgMonthlyExpense ?? 0}
              color={EXPENSE_COLOR}
              icon={<ShoppingCart className="size-5" />}
              locale={locale}
              symbol={symbol}
              extra={translate(
                "panel.overall.overMonths",
                { months: report?.data?.activeMonths ?? 0 },
                `over ${report?.data?.activeMonths ?? 0} months`
              )}
            />
          </div>
          <Card>
            <CardContent>
              <YearChart years={report?.data?.years ?? []} locale={locale} currency={currency} />
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <HeatMapChart
                years={report?.data?.years ?? []}
                heatmap={report?.data?.heatmap ?? []}
                locale={locale}
                currency={currency}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
