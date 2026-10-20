import React, { useMemo } from "react";

import { CrudFilters, IResourceComponentsProps, HttpError, useMany } from "@refinedev/core";

import { List, TextField, useImport, ImportButton, useTable } from "@refinedev/antd";
import { Table, Select, Row, Col, Form, Input, Button, Tooltip } from "antd";

import { SearchOutlined } from "@ant-design/icons";

import { IAccount, IItem, IUser } from "../../../interfaces";
import { ITEM_ORIGINS } from "../../../constants";
import { ItemTypeIcon } from "../../../components/common/ItemTypeIcon";
import { ResourceActions } from "../../../components/common/ResourceActions";
import { useUserSelect } from "../../../hooks/useUserSelect";
import { useAccountSelect } from "../../../hooks/useAccountSelect";

export const ItemList: React.FC<IResourceComponentsProps> = () => {
  const importProps = useImport<IItem>();
  const { tableProps, searchFormProps } = useTable<
    IItem,
    HttpError,
    { description: string; userId: number; accountId: number; origin: string }
  >({
    syncWithLocation: true,
    onSearch: (params: { description: string; userId: number; accountId: number; origin: string }) => {
      const crudFilters: CrudFilters = [];
      const { description, userId, accountId, origin } = params;

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
      crudFilters.push({
        field: "accountId",
        operator: "eq",
        value: accountId,
      });
      crudFilters.push({
        field: "origin",
        operator: "eq",
        value: origin,
      });

      return crudFilters;
    },
  });

  const selectedUserId = Form.useWatch("userId", searchFormProps.form);
  const { selectProps: accountSelectProps } = useAccountSelect(selectedUserId);

  const userIds = useMemo(
    () => [...new Set(tableProps?.dataSource?.map((item) => item.userId) ?? [])],
    [tableProps?.dataSource]
  );
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

  const accountIds = useMemo(
    () => [...new Set(tableProps?.dataSource?.map((item) => item.accountId) ?? [])],
    [tableProps?.dataSource]
  );
  const {
    result: accounts,
    query: { isLoading: isLoadingAccounts },
  } = useMany<IAccount>({
    resource: "accounts",
    ids: accountIds,
    queryOptions: {
      enabled: accountIds.length > 0,
    },
  });

  const userNameById = useMemo(() => new Map((data?.data ?? []).map((user) => [user.id, user.name] as const)), [data]);
  const accountNameById = useMemo(
    () => new Map((accounts?.data ?? []).map((account) => [account.id, account.name] as const)),
    [accounts]
  );

  const { selectProps: userSelectProps } = useUserSelect();

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={6}>
        <Form {...searchFormProps} layout="vertical">
          <Form.Item label="Description" name="description">
            <Input placeholder="Description" prefix={<SearchOutlined />} />
          </Form.Item>
          <Form.Item label="User" name="userId">
            <Select {...userSelectProps} allowClear />
          </Form.Item>
          <Form.Item label="Account" name="accountId">
            <Select {...accountSelectProps} allowClear />
          </Form.Item>
          <Form.Item label="Origin" name="origin">
            <Select
              options={ITEM_ORIGINS.map((value) => ({ value, label: value }))}
              allowClear
            />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary">
              Filter
            </Button>
          </Form.Item>
        </Form>
      </Col>
      <Col xs={24} lg={18}>
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
            <Table.Column dataIndex="origin" title="Origin" />
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
            <Table.Column
              dataIndex="accountId"
              title="Account"
              render={(value) => {
                if (isLoadingAccounts) {
                  return <TextField value="Loading..." />;
                }

                return <TextField value={accountNameById.get(value)} />;
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
