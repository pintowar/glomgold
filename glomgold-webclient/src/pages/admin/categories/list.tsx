import { useMemo } from "react";
import { useList, useTranslate, type CrudFilter } from "@refinedev/core";
import { useTable } from "@refinedev/react-table";
import { useForm } from "react-hook-form";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { PageHeader } from "@/components/common/PageHeader";
import { CategoryBadge } from "@/components/common/CategoryBadge";
import { CategoryDeleteDialog } from "@/components/common/CategoryDeleteDialog";
import { EditButton } from "@/components/refine-ui/buttons/edit";
import { SelectInput, TextInput } from "@/components/common/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import { useUserSelect } from "@/hooks/useUserSelect";
import type { ICategory, IUser } from "@/interfaces";

const ALL = { pagination: { pageSize: 1000 } };

interface FilterValues {
  name?: string;
  groupId?: number;
  userId?: number;
}

export const CategoryList = () => {
  const translate = useTranslate();
  const { register, handleSubmit, setValue, watch } = useForm<FilterValues>({});
  const { categories, groups } = useCategories();
  const { options: userOptions } = useUserSelect();

  const { result: users } = useList<IUser>({ resource: "users", ...ALL });
  const groupNameById = useMemo(() => new Map(groups.map((group) => [group.id, group.name] as const)), [groups]);
  const userNameById = useMemo(() => new Map((users?.data ?? []).map((user) => [user.id, user.name] as const)), [users]);

  const columns = useMemo<ColumnDef<ICategory>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: translate("panel.category.field.name", "Name"),
        cell: ({ row }) => <CategoryBadge category={row.original} />,
      },
      {
        id: "groupId",
        accessorKey: "groupId",
        header: translate("panel.category.field.group", "Group"),
        cell: ({ row }) => groupNameById.get(row.original.groupId ?? -1) ?? "-",
      },
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
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <EditButton variant="outline" size="icon" recordItemId={row.original.id} />
            <CategoryDeleteDialog
              record={row.original}
              candidates={categories.filter((category) => category.id !== row.original.id)}
              resource="categories"
              usageUrl="/api/categories/usage"
              invalidates={["list", "many"]}
            />
          </div>
        ),
      },
    ],
    [translate, categories, groupNameById, userNameById]
  );

  const table = useTable<ICategory>({
    refineCoreProps: { resource: "categories", syncWithLocation: true },
    columns,
  });

  const onSearch = (values: FilterValues) =>
    table.refineCore.setFilters(
      [
        { field: "name", operator: "eq", value: values.name?.trim() },
        { field: "groupId", operator: "eq", value: values.groupId },
        { field: "userId", operator: "eq", value: values.userId },
      ].filter((filter) => filter.value !== undefined && filter.value !== "") as CrudFilter[],
      "replace"
    );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={translate("categories.categories", "Categories")} />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardContent>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSearch)}>
              <TextInput label={translate("panel.category.field.name", "Name")} {...register("name")} />
              <SelectInput
                label={translate("panel.category.field.group", "Group")}
                options={groups.map((group) => ({ value: `${group.id}`, label: group.name }))}
                value={watch("groupId")}
                onChange={(value) => setValue("groupId", value as number | undefined)}
                allowClear
              />
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
