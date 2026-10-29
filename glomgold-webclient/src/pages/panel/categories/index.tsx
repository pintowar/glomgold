import React, { useMemo, useState } from "react";
import {
  useCreate,
  useCustom,
  useCustomMutation,
  useDelete,
  useInvalidate,
  useList,
  useTranslate,
  useUpdate,
} from "@refinedev/core";
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Typography,
} from "antd";
import { DeleteOutlined } from "@ant-design/icons";

import type { ICategory, ICategoryGroup, ICategoryUsage } from "../../../interfaces";
import { CategoryBadge } from "../../../components/common/CategoryBadge";
import { errorPayload, successPayload } from "../../../utils/notify";

const RESOURCE = "panel/categories";
const GROUP_RESOURCE = "panel/category-groups";
const ALL = { pagination: { pageSize: 500 } };

/** Delete is usage-aware: referencing items must be transferred to another category first. */
const CategoryDeleteButton: React.FC<{ record: ICategory; candidates: ICategory[] }> = ({ record, candidates }) => {
  const translate = useTranslate();
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<number>();
  const { mutate: removeOne } = useDelete();
  const { mutate: removeWithTransfer } = useCustomMutation();

  const { result: usage, query } = useCustom<ICategoryUsage>({
    url: `/api/panel/categories/usage/${record.id}`,
    method: "get",
    queryOptions: { enabled: open, retry: false },
  });
  const itemCount = usage?.data?.itemCount ?? 0;

  const done = () => {
    setOpen(false);
    setTarget(undefined);
    void invalidate({ resource: RESOURCE, invalidates: ["list"] });
  };

  const confirm = () => {
    const successNotification = successPayload(translate("panel.category.removed", "Category removed."));
    const errorNotification = errorPayload(translate("panel.category.removeError", "Could not remove category."));
    if (itemCount === 0) {
      removeOne({ resource: RESOURCE, id: record.id, successNotification, errorNotification }, { onSuccess: done });
    } else {
      removeWithTransfer(
        {
          url: `/api/panel/categories/${record.id}?transferTo=${target}`,
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
      <Button size="small" danger icon={<DeleteOutlined />} data-cy="remove-category" onClick={() => setOpen(true)} />
      <Modal
        open={open}
        title={translate("panel.category.remove", "Remove category")}
        onCancel={() => setOpen(false)}
        onOk={confirm}
        okButtonProps={{ danger: true, disabled: query.isLoading || (itemCount > 0 && !target) }}
        confirmLoading={query.isLoading}
        okText={translate("panel.profile.save", "Save")}
        cancelText={translate("panel.items.importCancel", "Cancel")}
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

export const CategoriesPanel: React.FC = () => {
  const translate = useTranslate();
  const invalidate = useInvalidate();
  const { result: categoryResult, query: categoryQuery } = useList<ICategory>({ resource: RESOURCE, ...ALL });
  const { result: groupResult, query: groupQuery } = useList<ICategoryGroup>({
    resource: GROUP_RESOURCE,
    ...ALL,
  });
  const { mutate: createCategory } = useCreate();
  const { mutate: updateCategory } = useUpdate();
  const { mutate: createGroup } = useCreate();
  const { mutate: updateGroup } = useUpdate();
  const { mutate: removeGroup } = useDelete();

  const [categoryForm] = Form.useForm<Pick<ICategory, "name" | "color" | "groupId">>();
  const [groupForm] = Form.useForm<Pick<ICategoryGroup, "name" | "color" | "position">>();
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [editingGroup, setEditingGroup] = useState<ICategoryGroup | null>(null);

  const categories = useMemo(() => categoryResult?.data ?? [], [categoryResult]);
  const groups = useMemo(() => groupResult?.data ?? [], [groupResult]);
  const groupNameById = useMemo(() => new Map(groups.map((g) => [g.id, g.name] as const)), [groups]);

  const openCategoryCreate = () => {
    setEditingCategory(null);
    categoryForm.resetFields();
    categoryForm.setFieldsValue({ color: "#6B7280" });
    setCategoryOpen(true);
  };

  const openCategoryEdit = (category: ICategory) => {
    setEditingCategory(category);
    categoryForm.resetFields();
    categoryForm.setFieldsValue({ name: category.name, color: category.color, groupId: category.groupId });
    setCategoryOpen(true);
  };

  const submitCategory = () => {
    void categoryForm.validateFields().then((values) => {
      const variables = {
        name: values.name,
        color: values.color || "#6B7280",
        groupId: values.groupId ?? null,
      };
      const onSuccess = () => {
        setCategoryOpen(false);
        categoryForm.resetFields();
      };
      if (editingCategory) {
        updateCategory(
          {
            resource: RESOURCE,
            id: editingCategory.id,
            values: variables,
            successNotification: successPayload(translate("panel.category.updated", "Category updated.")),
            errorNotification: errorPayload(translate("panel.category.updateError", "Could not update category.")),
          },
          { onSuccess }
        );
      } else {
        createCategory(
          {
            resource: RESOURCE,
            values: variables,
            successNotification: successPayload(translate("panel.category.created", "Category created.")),
            errorNotification: errorPayload(translate("panel.category.createError", "Could not create category.")),
          },
          { onSuccess }
        );
      }
    });
  };

  const remove = (group: ICategoryGroup) =>
    removeGroup(
      {
        resource: GROUP_RESOURCE,
        id: group.id,
        successNotification: successPayload(translate("panel.category.group.removed", "Group removed.")),
        errorNotification: errorPayload(translate("panel.category.group.removeError", "Could not remove group.")),
      },
      // Unlinking happens server-side, so the category list becomes stale too.
      { onSuccess: () => void invalidate({ resource: RESOURCE, invalidates: ["list"] }) }
    );

  const openGroupCreate = () => {
    setEditingGroup(null);
    groupForm.resetFields();
    groupForm.setFieldsValue({ color: "#6B7280", position: 0 });
    setGroupOpen(true);
  };

  const openGroupEdit = (group: ICategoryGroup) => {
    setEditingGroup(group);
    groupForm.resetFields();
    groupForm.setFieldsValue({ name: group.name, color: group.color, position: group.position });
    setGroupOpen(true);
  };

  const submitGroup = () => {
    void groupForm.validateFields().then((values) => {
      const variables = { name: values.name, color: values.color || "#6B7280", position: values.position ?? 0 };
      const onSuccess = () => {
        setGroupOpen(false);
        groupForm.resetFields();
      };
      if (editingGroup) {
        updateGroup(
          {
            resource: GROUP_RESOURCE,
            id: editingGroup.id,
            values: variables,
            successNotification: successPayload(translate("panel.category.group.updated", "Group updated.")),
            errorNotification: errorPayload(translate("panel.category.group.updateError", "Could not update group.")),
          },
          { onSuccess }
        );
      } else {
        createGroup(
          {
            resource: GROUP_RESOURCE,
            values: variables,
            successNotification: successPayload(translate("panel.category.group.created", "Group created.")),
            errorNotification: errorPayload(translate("panel.category.group.createError", "Could not create group.")),
          },
          { onSuccess }
        );
      }
    });
  };

  return (
    <div className="card-row" data-cy="categories-panel">
      <Card
        title={translate("panel.category.pageTitle", "Categories")}
        variant="borderless"
        extra={
          <Button type="primary" data-cy="new-category" onClick={openCategoryCreate}>
            {translate("panel.category.new", "New Category")}
          </Button>
        }
      >
        <Table<ICategory> rowKey="id" dataSource={categories} loading={categoryQuery.isLoading} pagination={false}>
          <Table.Column
            dataIndex="name"
            title={translate("panel.category.field.name", "Name")}
            render={(_, category: ICategory) => <CategoryBadge category={category} />}
          />
          <Table.Column
            dataIndex="groupId"
            title={translate("panel.category.field.group", "Group")}
            render={(value: number | null) => groupNameById.get(value ?? -1) ?? "-"}
          />
          <Table.Column
            title={translate("panel.items.column.action", "Action")}
            render={(_, category: ICategory) => (
              <Space>
                <Button size="small" data-cy="edit-category" onClick={() => openCategoryEdit(category)}>
                  {translate("panel.category.edit", "Edit")}
                </Button>
                <CategoryDeleteButton record={category} candidates={categories.filter((c) => c.id !== category.id)} />
              </Space>
            )}
          />
        </Table>
      </Card>

      <Card
        title={translate("panel.category.group.pageTitle", "Category Groups")}
        variant="borderless"
        extra={
          <Button type="primary" data-cy="new-category-group" onClick={openGroupCreate}>
            {translate("panel.category.group.new", "New Group")}
          </Button>
        }
      >
        <Table<ICategoryGroup> rowKey="id" dataSource={groups} loading={groupQuery.isLoading} pagination={false}>
          <Table.Column
            dataIndex="name"
            title={translate("panel.category.field.name", "Name")}
            render={(_, group: ICategoryGroup) => <CategoryBadge category={group} />}
          />
          <Table.Column dataIndex="position" title={translate("panel.category.field.position", "Position")} />
          <Table.Column
            title={translate("panel.items.column.action", "Action")}
            render={(_, group: ICategoryGroup) => (
              <Space>
                <Button size="small" data-cy="edit-category-group" onClick={() => openGroupEdit(group)}>
                  {translate("panel.category.edit", "Edit")}
                </Button>
                <Popconfirm
                  title={translate(
                    "panel.category.group.confirmRemove",
                    "Sure to remove? Its categories will become ungrouped."
                  )}
                  onConfirm={() => remove(group)}
                  okText={translate("panel.profile.save", "Save")}
                  cancelText={translate("panel.items.importCancel", "Cancel")}
                >
                  <Button size="small" danger data-cy="remove-category-group">
                    {translate("panel.category.group.remove", "Remove group")}
                  </Button>
                </Popconfirm>
              </Space>
            )}
          />
        </Table>
      </Card>

      <Modal
        title={
          editingCategory ? translate("panel.category.edit", "Edit") : translate("panel.category.new", "New Category")
        }
        open={categoryOpen}
        onOk={submitCategory}
        onCancel={() => setCategoryOpen(false)}
        okText={translate("panel.profile.save", "Save")}
        cancelText={translate("panel.items.importCancel", "Cancel")}
      >
        <Form form={categoryForm} layout="vertical" onFinish={submitCategory}>
          <Form.Item
            label={translate("panel.category.field.name", "Name")}
            name="name"
            rules={[{ required: true, message: translate("panel.category.nameRequired", "Please input a name!") }]}
          >
            <Input autoFocus data-cy="category-name" />
          </Form.Item>
          <Form.Item label={translate("panel.category.field.color", "Color")} name="color">
            <Input type="color" data-cy="category-color" />
          </Form.Item>
          <Form.Item label={translate("panel.category.field.group", "Group")} name="groupId">
            <Select
              allowClear
              data-cy="category-group"
              options={groups.map((group) => ({ value: group.id, label: group.name }))}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          editingGroup
            ? translate("panel.category.group.edit", "Edit group")
            : translate("panel.category.group.new", "New Group")
        }
        open={groupOpen}
        onOk={submitGroup}
        onCancel={() => setGroupOpen(false)}
        okText={translate("panel.profile.save", "Save")}
        cancelText={translate("panel.items.importCancel", "Cancel")}
      >
        <Form form={groupForm} layout="vertical" onFinish={submitGroup}>
          <Form.Item
            label={translate("panel.category.field.name", "Name")}
            name="name"
            rules={[{ required: true, message: translate("panel.category.nameRequired", "Please input a name!") }]}
          >
            <Input autoFocus data-cy="category-group-name" />
          </Form.Item>
          <Form.Item label={translate("panel.category.field.color", "Color")} name="color">
            <Input type="color" data-cy="category-group-color" />
          </Form.Item>
          <Form.Item label={translate("panel.category.field.position", "Position")} name="position">
            <InputNumber min={0} data-cy="category-group-position" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
