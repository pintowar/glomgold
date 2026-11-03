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
  const usersData = users?.data;
  const userNameById = useMemo(() => new Map((usersData ?? []).map((user) => [user.id, user.name] as const)), [usersData]);
  // Lookup maps must not rebuild `columns`: @refinedev/react-table resets to page 1 whenever columns change while filters are active.
  const userNameByIdRef = useRef(userNameById);
  userNameByIdRef.current = userNameById;

  const columns = useMemo<ColumnDef<ICategoryGroup>[]>(
    () => [
      { id: "name", accessorKey: "name", header: translate("panel.category.field.name", "Name") },
      { id: "position", accessorKey: "position", header: translate("panel.category.field.position", "Position") },
      {
        id: "userId",
        accessorKey: "userId",
        filterFn: "equals",
        header: translate("panel.category.field.user", "User"),
        cell: ({ row }) => userNameByIdRef.current.get(row.original.userId) ?? "Loading...",
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
    [translate]
  );

  const table = useTable<ICategoryGroup>({
    refineCoreProps: { resource: "category-groups", syncWithLocation: true },
    columns,
  });

  const onSearch = ({ name, userId }: FilterValues) =>
    table.reactTable.setColumnFilters([
      ...(name?.trim() ? [{ id: "name", value: name.trim() }] : []),
      ...(userId !== undefined ? [{ id: "userId", value: userId }] : []),
    ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={translate("category-groups.category-groups", "Category Groups")} actions={<CreateButton />} />
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
