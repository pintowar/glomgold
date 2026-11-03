import { useMemo, useRef } from "react";
import { useList, useTranslate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { PageHeader } from "@/components/common/PageHeader";
import { CreateButton } from "@/components/refine-ui/buttons/create";
import { ResourceActions } from "@/components/common/ResourceActions";
import { SelectInput, TextInput } from "@/components/common/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ACCOUNT_TYPES, type AccountType } from "@/constants";
import { useUserSelect } from "@/hooks/useUserSelect";
import type { IAccount, IUser } from "@/interfaces";

const ALL = { pagination: { pageSize: 1000 } };

interface FilterValues {
  userId?: number;
  type?: AccountType;
  currency?: string;
}

export const AccountList = () => {
  const translate = useTranslate();
  const { options: userOptions } = useUserSelect();
  const { register, handleSubmit, setValue, watch } = useForm<FilterValues>({});

  const { result: users } = useList<IUser>({ resource: "users", ...ALL });
  const usersData = users?.data;
  const userNameById = useMemo(() => new Map((usersData ?? []).map((user) => [user.id, user.name] as const)), [usersData]);
  // Lookup maps must not rebuild `columns`: @refinedev/react-table resets to page 1 whenever columns change while filters are active.
  const userNameByIdRef = useRef(userNameById);
  userNameByIdRef.current = userNameById;

  const columns = useMemo<ColumnDef<IAccount>[]>(
    () => [
      { id: "id", accessorKey: "id", header: "ID" },
      { id: "name", accessorKey: "name", header: translate("panel.account.field.name", "Name") },
      {
        id: "type",
        accessorKey: "type",
        header: translate("panel.account.field.type", "Type"),
        cell: ({ row }) => translate(`panel.account.type.${row.original.type}`, row.original.type),
      },
      { id: "currency", accessorKey: "currency", header: translate("panel.account.field.currency", "Currency") },
      {
        id: "userId",
        accessorKey: "userId",
        filterFn: "equals",
        header: translate("panel.account.field.user", "User"),
        cell: ({ row }) => userNameByIdRef.current.get(row.original.userId) ?? "Loading...",
      },
      {
        id: "actions",
        header: translate("panel.items.column.action", "Action"),
        cell: ({ row }) => <ResourceActions recordId={row.original.id} />,
      },
    ],
    [translate]
  );

  const table = useTable<IAccount>({
    refineCoreProps: { resource: "accounts", syncWithLocation: true },
    columns,
  });

  const onSearch = ({ userId, type, currency }: FilterValues) =>
    table.reactTable.setColumnFilters([
      ...(userId !== undefined ? [{ id: "userId", value: userId }] : []),
      ...(type ? [{ id: "type", value: type }] : []),
      ...(currency?.trim() ? [{ id: "currency", value: currency.trim().toUpperCase() }] : []),
    ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={translate("accounts.accounts", "Accounts")} actions={<CreateButton />} />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSearch)}>
              <SelectInput
                label={translate("panel.account.field.user", "User")}
                options={userOptions}
                value={watch("userId")}
                onChange={(value) => setValue("userId", value as number | undefined)}
                allowClear
              />
              <SelectInput
                label={translate("panel.account.field.type", "Type")}
                options={ACCOUNT_TYPES.map((value) => ({
                  value,
                  label: translate(`panel.account.type.${value}`, value),
                }))}
                value={watch("type")}
                onChange={(value) => setValue("type", value as AccountType | undefined)}
                allowClear
              />
              <TextInput
                label={translate("panel.account.field.currency", "Currency")}
                maxLength={3}
                {...register("currency")}
              />
              <Button type="submit">{translate("panel.items.filter.filter", "Filter")}</Button>
            </form>
          </CardContent>
        </Card>
        <DataTable table={table} />
      </div>
    </div>
  );
};
