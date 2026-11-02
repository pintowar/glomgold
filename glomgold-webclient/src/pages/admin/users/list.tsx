import { useTable } from "@refinedev/react-table";
import type { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";
import { useTranslate } from "@refinedev/core";

import { DataTable } from "@/components/refine-ui/data-table/data-table";
import { BoolField } from "@/components/common/BoolField";
import { PageHeader } from "@/components/common/PageHeader";
import { ResourceActions } from "@/components/common/ResourceActions";
import type { IUser } from "@/interfaces";

export const UserList = () => {
  const translate = useTranslate();

  const columns = useMemo<ColumnDef<IUser>[]>(
    () => [
      { id: "id", accessorKey: "id", header: "ID" },
      { id: "name", accessorKey: "name", header: translate("users.field.name", "Name") },
      { id: "username", accessorKey: "username", header: translate("users.field.username", "Username") },
      { id: "email", accessorKey: "email", header: translate("users.field.email", "E-mail") },
      {
        id: "enabled",
        accessorKey: "enabled",
        header: translate("users.field.enabled", "Enabled"),
        cell: ({ row }) => <BoolField value={row.original.enabled} />,
      },
      {
        id: "admin",
        accessorKey: "admin",
        header: translate("users.field.admin", "Admin"),
        cell: ({ row }) => <BoolField value={row.original.admin} />,
      },
      { id: "locale", accessorKey: "locale", header: translate("users.field.locale", "Locale") },
      { id: "timezone", accessorKey: "timezone", header: translate("users.field.timezone", "Timezone") },
      {
        id: "actions",
        header: translate("panel.items.column.action", "Action"),
        cell: ({ row }) => <ResourceActions recordId={row.original.id} />,
      },
    ],
    [translate]
  );

  const table = useTable<IUser>({
    refineCoreProps: { resource: "users", syncWithLocation: true },
    columns,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={translate("users.users", "Users")} />
      <DataTable table={table} />
    </div>
  );
};
