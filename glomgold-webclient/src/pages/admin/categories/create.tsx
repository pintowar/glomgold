import React from "react";
import { IResourceComponentsProps, useTranslate } from "@refinedev/core";

import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

import { ICategory } from "../../../interfaces";
import { useCategories } from "../../../hooks/useCategories";
import { useUserSelect } from "../../../hooks/useUserSelect";

export const CategoryCreate: React.FC<IResourceComponentsProps> = () => {
  const translate = useTranslate();
  const { form, formProps, saveButtonProps } = useForm<ICategory>();
  const { selectProps: userSelectProps } = useUserSelect();
  const { groups } = useCategories();
  const userId = Form.useWatch("userId", form);

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("panel.category.field.name", "Name")}
          name="name"
          rules={[
            {
              required: true,
              message: translate("panel.category.nameRequired", "Please input a name!"),
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item label={translate("panel.category.field.color", "Color")} name="color" initialValue="#6B7280">
          <Input type="color" />
        </Form.Item>
        <Form.Item label={translate("panel.category.field.group", "Group")} name="groupId">
          <Select
            allowClear
            options={groups
              .filter((group) => userId == null || group.userId === userId)
              .map((group) => ({ value: group.id, label: group.name }))}
          />
        </Form.Item>
        <Form.Item label={translate("panel.category.field.user", "User")} name="userId">
          <Select {...userSelectProps} allowClear />
        </Form.Item>
      </Form>
    </Create>
  );
};
