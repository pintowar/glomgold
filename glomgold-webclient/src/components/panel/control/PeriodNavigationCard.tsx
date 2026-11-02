import dayjs from "dayjs";
import { useTranslate } from "@refinedev/core";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { MonthPicker } from "../../common/period-pickers";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import type { IAccount } from "../../../interfaces";

interface PeriodNavigationCardProps {
  value: string;
  onValueChange: (period: string) => void;
  locale: string;
  accounts?: IAccount[];
  accountId?: number;
  onAccountChange?: (accountId: number) => void;
}

export const PeriodNavigationCard = ({
  value,
  onValueChange,
  locale,
  accounts,
  accountId,
  onAccountChange,
}: PeriodNavigationCardProps) => {
  const translate = useTranslate();
  const shift = (months: number) => onValueChange(dayjs(value, "YYYY-MM").add(months, "month").format("YYYY-MM"));

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="text-base">{translate("panel.periodNavigation.title", "Period Navigation")}</CardTitle>
        {accounts && accounts.length > 0 && (
          <Select value={accountId == null ? undefined : `${accountId}`} onValueChange={(next) => onAccountChange?.(Number(next))}>
            <SelectTrigger className="w-[160px]" data-testid="account-filter">
              <SelectValue placeholder={translate("panel.account.label", "Account")} />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={`${account.id}`}>
                  {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="flex items-center gap-3">
        <Button variant="ghost" size="icon" data-testid="navigate-left" onClick={() => shift(-1)}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" data-testid="navigate-right" onClick={() => shift(1)}>
          <ChevronRight className="size-4" />
        </Button>
        <MonthPicker value={value} onChange={onValueChange} locale={locale} />
      </CardContent>
    </Card>
  );
};
