import { useTranslate } from "@refinedev/core";

import { ChangePasswordCard } from "@/components/dashboard/ChangePasswordCard";
import { ManagementInfoCard } from "@/components/dashboard/ManagementInfoCard";
import { PageHeader } from "@/components/common/PageHeader";

export const DashboardPage = () => {
  const translate = useTranslate();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={translate("header.menu.dashboard", "Dashboard")} />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <ManagementInfoCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
};
