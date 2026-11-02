import { useOne, useShow, useTranslate } from "@refinedev/core";
import { Link } from "react-router";

import { PageHeader } from "@/components/common/PageHeader";
import { ShowField } from "@/components/common/ShowField";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { IItem, IUser } from "@/interfaces";

export const ItemShow = () => {
  const translate = useTranslate();
  const {
    result: record,
    query: { isLoading },
  } = useShow<IItem>({ resource: "items" });
  const {
    result: user,
    query: { isLoading: userIsLoading },
  } = useOne<IUser>({
    resource: "users",
    id: record?.userId ?? "",
    queryOptions: { enabled: !!record },
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={translate("items.item", "Item")}
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/items">Back</Link>
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
              <ShowField label={translate("panel.items.column.description", "Description")}>{record?.description}</ShowField>
              <ShowField label={translate("panel.items.column.value", "Value")}>{record?.value}</ShowField>
              <ShowField label={translate("items.field.period", "Period")}>
                {record?.year}-{record?.month}
              </ShowField>
              <ShowField label={translate("panel.account.field.user", "User")}>
                {userIsLoading ? "Loading..." : user?.name}
              </ShowField>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
