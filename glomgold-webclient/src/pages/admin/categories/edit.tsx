import React from "react";
import { IResourceComponentsProps, useTranslate } from "@refinedev/core";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

import { ICategory } from "../../../interfaces";
import { useCategories } from "../../../hooks/useCategories";
import { useUserSelect } from "../../../hooks/useUserSelect";

export const CategoryEdit: React.FC<IResourceComponentsProps> = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps, query } = useForm<ICategory>({ warnWhenUnsavedChanges: true });
  const postData = query?.data?.data;
  const { selectProps: userSelectProps } = useUserSelect(postData?.userId);
  const { groups } = useCategories();

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="ID" name="id" hidden={true}>
          <Input />
        </Form.Item>
        <Form.Item label="Version" name="version" hidden={true}>
          <Input />
        </Form.Item>
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
        <Form.Item label={translate("panel.category.field.color", "Color")} name="color">
          <Input type="color" />
        </Form.Item>
        <Form.Item label={translate("panel.category.field.group", "Group")} name="groupId">
          <Select
            allowClear
            options={groups
              .filter((group) => postData == null || group.userId === postData.userId)
              .map((group) => ({ value: group.id, label: group.name }))}
          />
        </Form.Item>
        <Form.Item label={translate("panel.category.field.user", "User")} name="userId">
          <Select {...userSelectProps} disabled />
        </Form.Item>
      </Form>
    </Edit>
  );
};
