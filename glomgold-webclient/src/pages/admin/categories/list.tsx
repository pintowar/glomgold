import React, { useMemo, useState } from "react";
import {
  CrudFilters,
  HttpError,
  IResourceComponentsProps,
  useCustom,
  useCustomMutation,
  useDelete,
  useInvalidate,
  useMany,
  useTranslate,
} from "@refinedev/core";
import { EditButton, List, TextField, useTable } from "@refinedev/antd";
import { Button, Col, Form, Input, Modal, Row, Select, Space, Spin, Table, Typography } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import { ICategory, ICategoryUsage, IUser } from "../../../interfaces";
import { CategoryBadge } from "../../../components/common/CategoryBadge";
import { useCategories } from "../../../hooks/useCategories";
import { useUserSelect } from "../../../hooks/useUserSelect";
import { errorPayload, successPayload } from "../../../utils/notify";

/** Delete is usage-aware: referencing items must be transferred to another category first. */
const CategoryDeleteButton: React.FC<{ record: ICategory; candidates: ICategory[] }> = ({ record, candidates }) => {
  const translate = useTranslate();
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<number>();
  const { mutate: removeOne } = useDelete();
  const { mutate: removeWithTransfer } = useCustomMutation();

  const { result: usage, query } = useCustom<ICategoryUsage>({
    url: `/api/categories/usage/${record.id}`,
    method: "get",
    queryOptions: { enabled: open, retry: false },
  });
  const itemCount = usage?.data?.itemCount ?? 0;

  const done = () => {
    setOpen(false);
    setTarget(undefined);
    void invalidate({ resource: "categories", invalidates: ["list", "many"] });
  };

  const confirm = () => {
    const successNotification = successPayload(translate("panel.category.removed", "Category removed."));
    const errorNotification = errorPayload(translate("panel.category.removeError", "Could not remove category."));
    if (itemCount === 0) {
      removeOne({ resource: "categories", id: record.id }, { onSuccess: done });
    } else {
      removeWithTransfer(
        {
          url: `/api/categories/${record.id}?transferTo=${target}`,
          method: "delete",
          values: {},
          successNotification,
          errorNotification,
        },
        { onSuccess: done }
      );
    }
  };

  return (
    <>
      <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setOpen(true)} />
      <Modal
        open={open}
        title={translate("panel.category.remove", "Remove category")}
        onCancel={() => setOpen(false)}
        onOk={confirm}
        okButtonProps={{ danger: true, disabled: query.isLoading || (itemCount > 0 && !target) }}
        confirmLoading={query.isLoading}
      >
        {query.isLoading ? (
          <Spin />
        ) : itemCount === 0 ? (
          <Typography.Text>{translate("panel.category.confirmRemove", "Sure to remove?")}</Typography.Text>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Typography.Text>
              {translate(
                "panel.category.transferPrompt",
                { count: itemCount },
                "{count} items use this category. Move them to:"
              )}
            </Typography.Text>
            <Select
              style={{ width: "100%" }}
              value={target}
              onChange={setTarget}
              options={candidates.map((c) => ({ value: c.id, label: <CategoryBadge category={c} /> }))}
            />
          </Space>
        )}
      </Modal>
    </>
  );
};

export const CategoryList: React.FC<IResourceComponentsProps> = () => {
  const translate = useTranslate();
  const { tableProps, searchFormProps } = useTable<
    ICategory,
    HttpError,
    { name: string; groupId: number; userId: number }
  >({
    syncWithLocation: true,
    onSearch: (params: { name: string; groupId: number; userId: number }) => {
      const crudFilters: CrudFilters = [];
      crudFilters.push({ field: "name", operator: "eq", value: params.name?.trim() });
      crudFilters.push({ field: "groupId", operator: "eq", value: params.groupId });
      crudFilters.push({ field: "userId", operator: "eq", value: params.userId });

      return crudFilters;
    },
  });
  const { categories, groups } = useCategories();
  const { selectProps: userSelectProps } = useUserSelect();

  const groupNameById = useMemo(() => new Map(groups.map((g) => [g.id, g.name] as const)), [groups]);

  const userIds = useMemo(
    () => [...new Set(tableProps?.dataSource?.map((category) => category.userId) ?? [])],
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

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={6}>
        <Form {...searchFormProps} layout="vertical">
          <Form.Item label={translate("panel.category.field.name", "Name")} name="name">
            <Input allowClear />
          </Form.Item>
          <Form.Item label={translate("panel.category.field.group", "Group")} name="groupId">
            <Select options={groups.map((group) => ({ value: group.id, label: group.name }))} allowClear />
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
            <Table.Column
              dataIndex="name"
              title={translate("panel.category.field.name", "Name")}
              render={(_, record: ICategory) => <CategoryBadge category={record} />}
            />
            <Table.Column
              dataIndex="groupId"
              title={translate("panel.category.field.group", "Group")}
              render={(value) => groupNameById.get(value) ?? "-"}
            />
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
            <Table.Column<ICategory>
              title={translate("panel.items.column.action", "Action")}
              dataIndex="actions"
              render={(_, record) => (
                <Space>
                  <EditButton hideText size="small" recordItemId={record.id} />
                  <CategoryDeleteButton record={record} candidates={categories.filter((c) => c.id !== record.id)} />
                </Space>
              )}
            />
          </Table>
        </List>
      </Col>
    </Row>
  );
};
