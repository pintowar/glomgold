import React, { useMemo } from "react";

import { CrudFilters, HttpError, IResourceComponentsProps, useMany, useTranslate } from "@refinedev/core";

import { List, TextField, useTable } from "@refinedev/antd";
import { Button, Col, Form, Row, Select, Table } from "antd";

import { IAccount, IUser } from "../../../interfaces";
import { ResourceActions } from "../../../components/common/ResourceActions";
import { useUserSelect } from "../../../hooks/useUserSelect";

export const AccountList: React.FC<IResourceComponentsProps> = () => {
  const translate = useTranslate();
  const { tableProps, searchFormProps } = useTable<IAccount, HttpError, { userId: number }>({
    syncWithLocation: true,
    onSearch: (params: { userId: number }) => {
      const crudFilters: CrudFilters = [];
      crudFilters.push({
        field: "userId",
        operator: "eq",
        value: params.userId,
      });

      return crudFilters;
    },
  });

  const userIds = useMemo(
    () => [...new Set(tableProps?.dataSource?.map((account) => account.userId) ?? [])],
    [tableProps?.dataSource]
  );
  const {
    result: users,
    query: { isLoading },
  } = useMany<IUser>({
    resource: "users",
    ids: userIds,
    queryOptions: {
      enabled: userIds.length > 0,
    },
  });

  const userNameById = useMemo(() => new Map((users?.data ?? []).map((user) => [user.id, user.name] as const)), [users]);
  const { selectProps: userSelectProps } = useUserSelect();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={6}>
        <Form {...searchFormProps} layout="vertical">
          <Form.Item label={translate("panel.account.field.user", "User")} name="userId">
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
            <Table.Column dataIndex="id" title="ID" />
            <Table.Column dataIndex="name" title={translate("panel.account.field.name", "Name")} />
            <Table.Column
              dataIndex="type"
              title={translate("panel.account.field.type", "Type")}
              render={(value: string) => translate(`panel.account.type.${value}`, value)}
            />
            <Table.Column dataIndex="currency" title={translate("panel.account.field.currency", "Currency")} />
            <Table.Column
              dataIndex="userId"
              title={translate("panel.account.field.user", "User")}
              render={(value) => {
                if (isLoading) {
                  return <TextField value="Loading..." />;
                }

                return <TextField value={userNameById.get(value)} />;
              }}
            />
            <Table.Column<IAccount>
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
