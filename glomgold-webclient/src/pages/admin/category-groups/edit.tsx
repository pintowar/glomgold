import React from "react";
import { IResourceComponentsProps, useTranslate } from "@refinedev/core";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";

import { ICategoryGroup } from "../../../interfaces";
import { useUserSelect } from "../../../hooks/useUserSelect";

export const CategoryGroupEdit: React.FC<IResourceComponentsProps> = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps, query } = useForm<ICategoryGroup>({ warnWhenUnsavedChanges: true });
  const { selectProps: userSelectProps } = useUserSelect(query?.data?.data?.userId);

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
        <Form.Item label={translate("panel.category.field.position", "Position")} name="position">
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item label={translate("panel.category.field.user", "User")} name="userId">
          <Select {...userSelectProps} disabled />
        </Form.Item>
      </Form>
    </Edit>
  );
};
