import { IResourceComponentsProps, useMany } from "@pankod/refine-core";

import {
    List,
    Table,
    Space,
    EditButton,
    DeleteButton,
} from "@pankod/refine-antd";

import { useTable, BooleanField, Icons } from "@pankod/refine-antd";

import { IUser } from "interfaces";

export const UserList: React.FC<IResourceComponentsProps> = () => {
    const { tableProps } = useTable<IUser>({
        syncWithLocation: true,
    });

    const { CloseCircleOutlined, CheckCircleOutlined } = Icons;

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" />
                <Table.Column dataIndex="name" title="Name" />
                <Table.Column dataIndex="username" title="Username" />
                <Table.Column dataIndex="email" title="E-mail" />
                <Table.Column dataIndex="enabled" title="Enabled" render={(value) =>
                    <BooleanField
                        value={value}
                        trueIcon={<CheckCircleOutlined />}
                        falseIcon={<CloseCircleOutlined />}
                        valueLabelTrue="Yes"
                        valueLabelFalse="No"
                    />
                }/>
                <Table.Column dataIndex="admin" title="Admin" render={(value) =>
                    <BooleanField
                        value={value}
                        trueIcon={<CheckCircleOutlined />}
                        falseIcon={<CloseCircleOutlined />}
                        valueLabelTrue="Yes"
                        valueLabelFalse="No"
                    />
                }/>
                <Table.Column dataIndex="locale" title="Locale" />
                <Table.Column dataIndex="timezone" title="Timezone" />

                <Table.Column<IUser>
                    title="Actions"
                    dataIndex="actions"
                    render={(_, record) => (
                        <Space>
                            <EditButton
                                hideText
                                size="small"
                                recordItemId={record.id}
                            />
                            <DeleteButton
                                hideText
                                size="small"
                                recordItemId={record.id}
                            />
                        </Space>
                    )}
                />
            </Table>
        </List>
    );
};
