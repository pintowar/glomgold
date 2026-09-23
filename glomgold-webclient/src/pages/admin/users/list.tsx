import React from "react";

import { IResourceComponentsProps } from "@refinedev/core";

import { List, useTable } from "@refinedev/antd";
import { Table } from "antd";

import { IUser } from "../../../interfaces";
import { BoolField } from "../../../components/common/BoolField";
import { ResourceActions } from "../../../components/common/ResourceActions";

export const UserList: React.FC<IResourceComponentsProps> = () => {
  const { tableProps } = useTable<IUser>({
    syncWithLocation: true,
  });

  return (
    <List>
      <Table {...tableProps} rowKey="id">
        <Table.Column dataIndex="id" title="ID" />
        <Table.Column dataIndex="name" title="Name" />
        <Table.Column dataIndex="username" title="Username" />
        <Table.Column dataIndex="email" title="E-mail" />
        <Table.Column dataIndex="enabled" title="Enabled" render={(value) => <BoolField value={value} />} />
        <Table.Column dataIndex="admin" title="Admin" render={(value) => <BoolField value={value} />} />
        <Table.Column dataIndex="locale" title="Locale" />
        <Table.Column dataIndex="timezone" title="Timezone" />

        <Table.Column<IUser>
          title="Actions"
          dataIndex="actions"
          render={(_, record) => <ResourceActions recordId={record.id} />}
        />
      </Table>
    </List>
  );
};
