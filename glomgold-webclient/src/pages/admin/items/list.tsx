import { useMemo, useRef } from "react";
import { useList, useTranslate } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { ImportCsvButton } from "@/components/admin/ImportCsvButton";
import { PageHeader } from "@/components/common/PageHeader";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { ItemTypeIcon } from "@/components/common/ItemTypeIcon";
import { ResourceActions } from "@/components/common/ResourceActions";
import { SelectInput, TextInput } from "@/components/common/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ITEM_ORIGINS } from "@/constants";
import { useAccountSelect } from "@/hooks/useAccountSelect";
import { useCategories } from "@/hooks/useCategories";
import { useUserSelect } from "@/hooks/useUserSelect";
import type { IAccount, IItem, IUser } from "@/interfaces";

interface FilterValues {
  description?: string;
  userId?: number;
  accountId?: number;
  origin?: string;
}

const ALL = { pagination: { pageSize: 1000 } };

export const ItemList = () => {
  const translate = useTranslate();
  const { register, handleSubmit, setValue, watch } = useForm<FilterValues>({});
  const { options: userOptions } = useUserSelect();
  const { options: accountOptions } = useAccountSelect(watch("userId"));
  const { categoryById } = useCategories();

  const { result: users } = useList<IUser>({ resource: "users", ...ALL });
  const { result: accounts } = useList<IAccount>({ resource: "accounts", ...ALL });
  const usersData = users?.data;
  const accountsData = accounts?.data;
  const userNameById = useMemo(() => new Map((usersData ?? []).map((user) => [user.id, user.name] as const)), [usersData]);
  const accountNameById = useMemo(
    () => new Map((accountsData ?? []).map((account) => [account.id, account.name] as const)),
    [accountsData]
  );
  // Lookup maps must not rebuild `columns`: @refinedev/react-table resets to page 1 whenever columns change while filters are active.
  const lookupsRef = useRef({ categoryById, userNameById, accountNameById });
  lookupsRef.current = { categoryById, userNameById, accountNameById };

  const columns = useMemo<ColumnDef<IItem>[]>(
    () => [
      { id: "id", accessorKey: "id", header: "ID" },
      {
        id: "itemType",
        accessorKey: "itemType",
        header: translate("panel.items.column.type", "Type"),
        cell: ({ row }) => (
          <span title={row.original.itemType}>
            <ItemTypeIcon type={row.original.itemType} />
          </span>
        ),
      },
      { id: "description", accessorKey: "description", header: translate("panel.items.column.description", "Description") },
      {
        id: "categoryId",
        accessorKey: "categoryId",
        header: translate("panel.items.column.category", "Category"),
        cell: ({ row }) => (
          <CategoryBadge category={row.original.categoryId != null ? lookupsRef.current.categoryById.get(row.original.categoryId) : null} />
        ),
      },
      { id: "value", accessorKey: "value", header: translate("panel.items.column.value", "Value") },
      { id: "year", accessorKey: "year", header: translate("items.field.year", "Year") },
      { id: "month", accessorKey: "month", header: translate("items.field.month", "Month") },
      { id: "origin", accessorKey: "origin", header: translate("panel.items.column.origin", "Origin") },
      {
        id: "userId",
        accessorKey: "userId",
        filterFn: "equals",
        header: translate("panel.account.field.user", "User"),
        cell: ({ row }) => lookupsRef.current.userNameById.get(row.original.userId) ?? "Loading...",
      },
      {
        id: "accountId",
        accessorKey: "accountId",
        filterFn: "equals",
        header: translate("panel.account.label", "Account"),
        cell: ({ row }) => lookupsRef.current.accountNameById.get(row.original.accountId) ?? "Loading...",
      },
      {
        id: "actions",
        header: translate("panel.items.column.action", "Action"),
        cell: ({ row }) => <ResourceActions recordId={row.original.id} />,
      },
    ],
    [translate]
  );

  const table = useTable<IItem>({
    refineCoreProps: { resource: "items", syncWithLocation: true },
    columns,
  });

  const onSearch = ({ description, userId, accountId, origin }: FilterValues) =>
    table.reactTable.setColumnFilters([
      ...(description?.trim() ? [{ id: "description", value: description.trim() }] : []),
      ...(userId !== undefined ? [{ id: "userId", value: userId }] : []),
      ...(accountId !== undefined ? [{ id: "accountId", value: accountId }] : []),
      ...(origin ? [{ id: "origin", value: origin }] : []),
    ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={translate("items.items", "Items")} actions={<ImportCsvButton />} />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSearch)}>
              <TextInput
                label={translate("panel.items.column.description", "Description")}
                placeholder={translate("panel.items.descriptionPlaceholder", "Description")}
                {...register("description")}
              />
              <SelectInput
                label={translate("panel.account.field.user", "User")}
                options={userOptions}
                value={watch("userId")}
                onChange={(value) => {
                  setValue("userId", value as number | undefined);
                  setValue("accountId", undefined);
                }}
                allowClear
              />
              <SelectInput
                label={translate("panel.account.label", "Account")}
                options={accountOptions}
                value={watch("accountId")}
                onChange={(value) => setValue("accountId", value as number | undefined)}
                allowClear
              />
              <SelectInput
                label={translate("panel.items.column.origin", "Origin")}
                options={ITEM_ORIGINS.map((value) => ({ value, label: value }))}
                value={watch("origin")}
                onChange={(value) => setValue("origin", value as string | undefined)}
                allowClear
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
