import { useShow, useTranslate } from "@refinedev/core";
import { Link } from "react-router";

import { PageHeader } from "@/components/common/PageHeader";
import { ShowField } from "@/components/common/ShowField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { IUser } from "@/interfaces";

export const UserShow = () => {
  const translate = useTranslate();
  const {
    result: record,
    query: { isLoading },
  } = useShow<IUser>({ resource: "users" });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={translate("users.item", "User")}
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/users">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="grid gap-2 md:grid-cols-2">
              <ShowField label="Id">{record?.id}</ShowField>
              <ShowField label={translate("users.field.name", "Name")}>{record?.name}</ShowField>
              <ShowField label={translate("users.field.username", "Username")}>{record?.username}</ShowField>
              <ShowField label={translate("users.field.email", "E-Mail")}>{record?.email}</ShowField>
              <ShowField label={translate("users.field.locale", "Locale")}>{record?.locale}</ShowField>
              <ShowField label={translate("users.field.timezone", "Timezone")}>{record?.timezone}</ShowField>
              <ShowField label={translate("users.field.enabled", "Enabled")}>{record?.enabled ? translate("panel.category.yes", "Yes") : translate("panel.category.no", "No")}</ShowField>
              <ShowField label={translate("users.field.admin", "Admin")}>{record?.admin ? translate("panel.category.yes", "Yes") : translate("panel.category.no", "No")}</ShowField>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
