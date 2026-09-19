import React, { useMemo } from "react";

import { CrudFilters, IResourceComponentsProps, HttpError, useMany } from "@refinedev/core";

import { List, TextField, useImport, ImportButton, useTable } from "@refinedev/antd";
import { Table, Select, Row, Col, Form, Input, Button, Tooltip } from "antd";

import { SearchOutlined } from "@ant-design/icons";

import { IItem, IUser } from "../../../interfaces";
import { ItemTypeIcon } from "../../../components/common/ItemTypeIcon";
import { ResourceActions } from "../../../components/common/ResourceActions";
import { useUserSelect } from "../../../hooks/useUserSelect";

export const ItemList: React.FC<IResourceComponentsProps> = () => {
  const importProps = useImport<IItem>();
  const { tableProps, searchFormProps } = useTable<IItem, HttpError, { description: string; userId: number }>({
    syncWithLocation: true,
    onSearch: (params: { description: string; userId: number }) => {
      const crudFilters: CrudFilters = [];
      const { description, userId } = params;

      crudFilters.push({
        field: "description",
        operator: "eq",
        value: description,
      });
      crudFilters.push({
        field: "userId",
        operator: "eq",
        value: userId,
      });

      return crudFilters;
    },
  });

  const userIds = useMemo(() => tableProps?.dataSource?.map((item) => item.userId) ?? [], [tableProps?.dataSource]);
  const {
    result: data,
    query: { isLoading },
  } = useMany<IUser>({
    resource: "users",
    ids: userIds,
    queryOptions: {
      enabled: userIds.length > 0,
    },
  });

  const userNameById = useMemo(() => new Map((data?.data ?? []).map((user) => [user.id, user.name] as const)), [data]);

  const { selectProps: userSelectProps } = useUserSelect();

  return (
    <Row gutter={[16, 16]}>
      <Col lg={6} xs={24}>
        <Form layout="vertical" {...searchFormProps}>
          <Form.Item label="Description" name="description">
            <Input placeholder="Description" prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item label="User" name="userId">
            <Select {...userSelectProps} allowClear />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              Filter
            </Button>
          </Form.Item>
        </Form>
      </Col>
      <Col lg={18} xs={24}>
        <List
          headerProps={{
            extra: <ImportButton {...importProps} />,
          }}
        >
          <Table {...tableProps} rowKey="id">
            <Table.Column dataIndex="id" title="ID" />
            <Table.Column
              dataIndex="itemType"
              title="Type"
              render={(value) => (
                <Tooltip placement="left" title={value}>
                  <ItemTypeIcon type={value} />
                </Tooltip>
              )}
            />
            <Table.Column dataIndex="description" title="Description" />
            <Table.Column dataIndex="value" title="Value" />
            <Table.Column dataIndex="year" title="Year" />
            <Table.Column dataIndex="month" title="Month" />
            <Table.Column
              dataIndex="userId"
              title="User"
              render={(value) => {
                if (isLoading) {
                  return <TextField value="Loading..." />;
                }

                return <TextField value={userNameById.get(value)} />;
              }}
            />
            <Table.Column<IItem>
              title="Actions"
              dataIndex="actions"
              render={(_, record) => <ResourceActions recordId={record.id} />}
            />
          </Table>
        </List>
      </Col>
    </Row>
  );
};
