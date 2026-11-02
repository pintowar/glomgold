import { useTranslate } from "@refinedev/core";
import { Calculator, DollarSign, ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { BALANCE_COLOR, DOWN_COLOR, EXPENSE_COLOR, INCOME_COLOR, UP_COLOR } from "../../../constants";
import type { ISummary } from "../../../interfaces";

const formatNumber = (value: number, locale: string) =>
  value.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

interface SummaryTabProps {
  desc: "Balance" | "Expense" | "Income";
  total: number | null;
  difference: number;
  locale: string;
  symbol: string;
}

const SummaryTab = ({ desc, total, difference, locale, symbol }: SummaryTabProps) => {
  const translate = useTranslate();
  const color = desc === "Expense" ? EXPENSE_COLOR : desc === "Income" ? INCOME_COLOR : BALANCE_COLOR;
  const Icon = desc === "Expense" ? ShoppingCart : desc === "Income" ? DollarSign : Calculator;
  const displayDesc = translate(`panel.periodSummary.${desc.toLowerCase()}`, desc);

  return (
    <div className="flex flex-wrap items-start gap-8">
      <div data-testid="monthly-value">
        <p className="text-sm text-muted-foreground">
          {translate("panel.periodSummary.monthly", { desc: displayDesc }, `Monthly ${displayDesc}`)}
        </p>
        <p className="flex items-center gap-1 text-2xl font-semibold" style={{ color }}>
          <Icon className="size-5" />
          {formatNumber(total ?? 0, locale)}
          <span className="text-base font-normal">{symbol}</span>
        </p>
      </div>
      <div data-testid="monthly-diff">
        <p className="text-sm text-muted-foreground">
          {translate("panel.periodSummary.monthlyDiff", "Monthly Percent Diff")}
        </p>
        <p className="flex items-center gap-1 text-2xl font-semibold" style={{ color: difference >= 0 ? UP_COLOR : DOWN_COLOR }}>
          {difference >= 0 ? <TrendingUp className="size-5" /> : <TrendingDown className="size-5" />}
          {formatNumber(100 * difference, locale)}%
        </p>
      </div>
    </div>
  );
};

export const PeriodSummaryCard = ({
  total,
  difference,
  locale,
  symbol,
}: {
  total: ISummary;
  difference: ISummary;
  locale: string;
  symbol: string;
}) => {
  const translate = useTranslate();

  return (
    <Card className="h-full" data-testid="period-summary-card">
      <CardHeader>
        <CardTitle className="text-base">{translate("panel.periodSummary.title", "Period Summary")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="balance">
          <TabsList>
            <TabsTrigger value="balance">{translate("panel.periodSummary.balance", "Balance")}</TabsTrigger>
            <TabsTrigger value="expense">{translate("panel.periodSummary.expense", "Expense")}</TabsTrigger>
            <TabsTrigger value="income">{translate("panel.periodSummary.income", "Income")}</TabsTrigger>
          </TabsList>
          <TabsContent value="balance">
            <SummaryTab desc="Balance" total={total.balance} difference={difference.balance} locale={locale} symbol={symbol} />
          </TabsContent>
          <TabsContent value="expense">
            <SummaryTab desc="Expense" total={total.expense} difference={difference.expense} locale={locale} symbol={symbol} />
          </TabsContent>
          <TabsContent value="income">
            <SummaryTab desc="Income" total={total.income} difference={difference.income} locale={locale} symbol={symbol} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
