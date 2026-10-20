import React from "react";

import { Row, Col, Card, Skeleton, Statistic, Space, Select, Typography } from "antd";
import { CalculatorOutlined, DollarOutlined, ShoppingCartOutlined } from "@ant-design/icons";

import { HeatMapChart, YearChart } from "../../../components/panel/report";
import { IPanelOverallReport } from "../../../interfaces";
import { useCustom, useTranslate } from "@refinedev/core";
import { BALANCE_COLOR, EXPENSE_COLOR, INCOME_COLOR } from "../../../constants";
import { useIdentityDefaults } from "../../../hooks/useIdentityDefaults";
import { usePanelSearchParams } from "../../../hooks/usePanelSearchParams";
import { usePanelAccounts } from "../../../hooks/usePanelAccounts";

const formatValue = (locale: string, value: number) =>
  value.toLocaleString(locale, { maximumFractionDigits: 2, minimumFractionDigits: 2 });

interface KpiCardProps {
  title: string;
  value: number;
  color: string;
  icon: React.ReactNode;
  locale: string;
  symbol: string;
  extra?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, color, icon, locale, symbol, extra }) => (
  <Card variant="borderless">
    <Statistic title={title} value={formatValue(locale, value)} valueStyle={{ color }} prefix={icon} suffix={symbol} />
    {extra && <div style={{ color, opacity: 0.7 }}>{extra}</div>}
  </Card>
);

export const OverallReportPanel: React.FC = () => {
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
    url: `/api/panel/overall-report`,
    method: "get",
    config: { query: { accountId } },
  });

  const data = report?.data;

  return (
    <>
      <div className="card-row">
        <Card variant="borderless">
          <Space size={12} wrap>
            <Typography.Text strong>{translate("panel.account.label", "Account")}</Typography.Text>
            <Select
              data-testid="report-account"
              allowClear
              value={accountId}
              onChange={(value?: number) =>
                updateSearchParams({ account: value !== undefined ? `${value}` : undefined })
              }
              style={{ minWidth: 200 }}
              placeholder={translate("panel.account.all", "All accounts")}
              options={accounts.map((account) => ({ value: account.id, label: account.name }))}
            />
          </Space>
        </Card>
      </div>
      {isLoading ? (
        <Skeleton active />
      ) : (
        <>
          <div className="card-row">
            <Row gutter={[24, 24]}>
              <Col span={6}>
                <KpiCard
                  title={translate("panel.overall.totalSpent", "Total Spent")}
                  value={data?.totalExpense ?? 0}
                  color={EXPENSE_COLOR}
                  icon={<ShoppingCartOutlined />}
                  locale={locale}
                  symbol={symbol}
                />
              </Col>
              <Col span={6}>
                <KpiCard
                  title={translate("panel.overall.totalEarned", "Total Earned")}
                  value={data?.totalIncome ?? 0}
                  color={INCOME_COLOR}
                  icon={<DollarOutlined />}
                  locale={locale}
                  symbol={symbol}
                />
              </Col>
              <Col span={6}>
                <KpiCard
                  title={translate("panel.overall.netBalance", "Net Balance")}
                  value={data?.totalBalance ?? 0}
                  color={BALANCE_COLOR}
                  icon={<CalculatorOutlined />}
                  locale={locale}
                  symbol={symbol}
                />
              </Col>
              <Col span={6}>
                <KpiCard
                  title={translate("panel.overall.avgMonthlyExpense", "Avg Monthly Expense")}
                  value={data?.avgMonthlyExpense ?? 0}
                  color={EXPENSE_COLOR}
                  icon={<ShoppingCartOutlined />}
                  locale={locale}
                  symbol={symbol}
                  extra={translate(
                    "panel.overall.overMonths",
                    { months: data?.activeMonths ?? 0 },
                    `over ${data?.activeMonths ?? 0} months`
                  )}
                />
              </Col>
            </Row>
          </div>
          <div className="card-row">
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card variant="borderless">
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    <YearChart years={data?.years ?? []} locale={locale} currency={currency} />
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
          <div className="card-row">
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <Card variant="borderless">
                  <Space direction="vertical" size={12} style={{ width: "100%" }}>
                    <HeatMapChart
                      years={data?.years ?? []}
                      heatmap={data?.heatmap ?? []}
                      locale={locale}
                      currency={currency}
                    />
                  </Space>
                </Card>
              </Col>
            </Row>
          </div>
        </>
      )}
    </>
  );
};
