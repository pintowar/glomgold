import { IResourceComponentsProps, useMany } from "@pankod/refine-core";

import {
    List,
    Table,
    TextField,
    Space,
    EditButton,
    ShowButton,
    DeleteButton,
    FilterDropdown,
    Select,
    getDefaultFilter,
} from "@pankod/refine-antd";

import { useTable, useSelect } from "@pankod/refine-antd";

import { IItem, IUser } from "interfaces";

export const ItemList: React.FC<IResourceComponentsProps> = () => {
    const { tableProps, filters } = useTable<IItem>({
        syncWithLocation: true,
    });

    const userIds =
        tableProps?.dataSource?.map((item) => item.userId) ?? [];
    const { data, isLoading } = useMany<IUser>({
        resource: "users",
        ids: userIds,
        queryOptions: {
            enabled: userIds.length > 0,
        },
    });

    const { selectProps: userSelectProps } = useSelect<IUser>({
        resource: "users",
        optionLabel: "name",
        optionValue: "id",
        defaultValue: getDefaultFilter("userId", filters, "in"),
    });

    return (
        <List>
            <Table {...tableProps} rowKey="id">
                <Table.Column dataIndex="id" title="ID" />
                <Table.Column dataIndex="description" title="Description" />
                <Table.Column dataIndex="value" title="Value" />
                <Table.Column dataIndex="currency" title="Currency" />
                <Table.Column dataIndex="year" title="Year" />
                <Table.Column dataIndex="month" title="Month" />
                <Table.Column
                    dataIndex="userId"
                    title="User"
                    render={(value) => {
                        if (isLoading) {
                            return <TextField value="Loading..." />;
                        }

                        return (
                            <TextField
                                value={data?.data.find((user) => user.id === value)?.name}
                            />
                        );
                    }}
                    filterDropdown={(props) => (
                        <FilterDropdown
                            {...props}
                            mapValue={(selectedKeys) => selectedKeys.map(Number)}
                        >
                            <Select
                                style={{ minWidth: 200 }}
                                mode="multiple"
                                placeholder="Select User"
                                {...userSelectProps}
                            />
                        </FilterDropdown>
                    )}
                    defaultFilteredValue={getDefaultFilter(
                        "userId",
                        filters,
                        "in",
                    )}
                />
                <Table.Column<IItem>
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
