import React from "react";

import { IResourceComponentsProps } from "@refinedev/core";

import { List, EditButton, DeleteButton, useTable, BooleanField } from "@refinedev/antd";
import { Table, Space } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

import { IUser } from "../../interfaces";

export const UserList: React.FC<IResourceComponentsProps> = () => {
    const { tableProps } = useTable<IUser>({
        syncWithLocation: true,
    });

    const boolField = (value: boolean) => (
        <BooleanField
            value={value}
            trueIcon={<CheckCircleOutlined />}
            falseIcon={<CloseCircleOutlined />}
            valueLabelTrue="Yes"
            valueLabelFalse="No"
        />
    );

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" />
                <Table.Column dataIndex="name" title="Name" />
                <Table.Column dataIndex="username" title="Username" />
                <Table.Column dataIndex="email" title="E-mail" />
                <Table.Column dataIndex="enabled" title="Enabled" render={boolField} />
                <Table.Column dataIndex="admin" title="Admin" render={boolField} />
                <Table.Column dataIndex="locale" title="Locale" />
                <Table.Column dataIndex="timezone" title="Timezone" />

                <Table.Column<IUser>
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record) => (
                        <Space>
                            <EditButton hideText size="small" recordItemId={record.id} />
                            <DeleteButton hideText size="small" recordItemId={record.id} />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
