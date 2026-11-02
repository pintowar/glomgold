import { useMemo } from "react";
import { useList, useTranslate, type CrudFilter } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { PageHeader } from "@/components/common/PageHeader";
import { ResourceActions } from "@/components/common/ResourceActions";
import { SelectInput, TextInput } from "@/components/common/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserSelect } from "@/hooks/useUserSelect";
import type { ICategoryGroup, IUser } from "@/interfaces";

const ALL = { pagination: { pageSize: 1000 } };

interface FilterValues {
  name?: string;
  userId?: number;
}

export const CategoryGroupList = () => {
  const translate = useTranslate();
  const { options: userOptions } = useUserSelect();
  const { register, handleSubmit, setValue, watch } = useForm<FilterValues>({});

  const { result: users } = useList<IUser>({ resource: "users", ...ALL });
  const userNameById = useMemo(() => new Map((users?.data ?? []).map((user) => [user.id, user.name] as const)), [users]);

  const columns = useMemo<ColumnDef<ICategoryGroup>[]>(
    () => [
      { id: "name", accessorKey: "name", header: translate("panel.category.field.name", "Name") },
      { id: "position", accessorKey: "position", header: translate("panel.category.field.position", "Position") },
      {
        id: "userId",
        accessorKey: "userId",
        header: translate("panel.category.field.user", "User"),
        cell: ({ row }) => userNameById.get(row.original.userId) ?? "Loading...",
      },
      {
        id: "isSystem",
        accessorKey: "isSystem",
        header: translate("panel.category.field.system", "System"),
        cell: ({ row }) =>
          row.original.isSystem ? translate("panel.category.yes", "Yes") : translate("panel.category.no", "No"),
      },
      {
        id: "actions",
        header: translate("panel.items.column.action", "Action"),
        cell: ({ row }) => <ResourceActions recordId={row.original.id} />,
      },
    ],
    [translate, userNameById]
  );

  const table = useTable<ICategoryGroup>({
    refineCoreProps: { resource: "category-groups", syncWithLocation: true },
    columns,
  });

  const onSearch = (values: FilterValues) =>
    table.refineCore.setFilters(
      [
        { field: "name", operator: "eq", value: values.name?.trim() },
        { field: "userId", operator: "eq", value: values.userId },
      ].filter((filter) => filter.value !== undefined && filter.value !== "") as CrudFilter[],
      "replace"
    );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={translate("category-groups.category-groups", "Category Groups")} />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSearch)}>
              <TextInput label={translate("panel.category.field.name", "Name")} {...register("name")} />
              <SelectInput
                label={translate("panel.category.field.user", "User")}
                options={userOptions}
                value={watch("userId")}
                onChange={(value) => setValue("userId", value as number | undefined)}
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
