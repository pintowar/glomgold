import React, { useMemo } from "react";
import { CrudFilters, HttpError, IResourceComponentsProps, useMany, useTranslate } from "@refinedev/core";

import { List, TextField, useTable } from "@refinedev/antd";
import { Button, Col, Form, Input, Row, Select, Table } from "antd";

import { ICategoryGroup, IUser } from "../../../interfaces";
import { ResourceActions } from "../../../components/common/ResourceActions";
import { useUserSelect } from "../../../hooks/useUserSelect";

export const CategoryGroupList: React.FC<IResourceComponentsProps> = () => {
  const translate = useTranslate();
  const { tableProps, searchFormProps } = useTable<ICategoryGroup, HttpError, { name: string; userId: number }>({
    syncWithLocation: true,
    onSearch: (params: { name: string; userId: number }) => {
      const crudFilters: CrudFilters = [];
      crudFilters.push({ field: "name", operator: "eq", value: params.name?.trim() });
      crudFilters.push({ field: "userId", operator: "eq", value: params.userId });

      return crudFilters;
    },
  });

  const userIds = useMemo(
    () => [...new Set(tableProps?.dataSource?.map((group) => group.userId) ?? [])],
    [tableProps?.dataSource]
  );
  const {
    result: users,
    query: { isLoading: isLoadingUsers },
  } = useMany<IUser>({
    resource: "users",
    ids: userIds,
    queryOptions: { enabled: userIds.length > 0 },
  });
  const userNameById = useMemo(
    () => new Map((users?.data ?? []).map((user) => [user.id, user.name] as const)),
    [users]
  );
  const { selectProps: userSelectProps } = useUserSelect();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={6}>
        <Form {...searchFormProps} layout="vertical">
          <Form.Item label={translate("panel.category.field.name", "Name")} name="name">
            <Input allowClear />
          </Form.Item>
          <Form.Item label={translate("panel.category.field.user", "User")} name="userId">
            <Select {...userSelectProps} allowClear />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              {translate("panel.items.filter.filter", "Filter")}
            </Button>
          </Form.Item>
        </Form>
      </Col>
      <Col xs={24} lg={18}>
        <List>
          <Table {...tableProps} rowKey="id">
            <Table.Column dataIndex="name" title={translate("panel.category.field.name", "Name")} />
            <Table.Column dataIndex="position" title={translate("panel.category.field.position", "Position")} />
            <Table.Column
              dataIndex="userId"
              title={translate("panel.category.field.user", "User")}
              render={(value) => <TextField value={isLoadingUsers ? "Loading..." : userNameById.get(value)} />}
            />
            <Table.Column
              dataIndex="isSystem"
              title={translate("panel.category.field.system", "System")}
              render={(value: boolean) =>
                value ? translate("panel.category.yes", "Yes") : translate("panel.category.no", "No")
              }
            />
            <Table.Column<ICategoryGroup>
              title={translate("panel.items.column.action", "Action")}
              dataIndex="actions"
              render={(_, record) => <ResourceActions recordId={record.id} />}
            />
          </Table>
        </List>
      </Col>
    </Row>
  );
};
