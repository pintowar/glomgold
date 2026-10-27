import React from "react";
import { IResourceComponentsProps, useTranslate } from "@refinedev/core";

import { Create, useForm } from "@refinedev/antd";
import { Form, Input, InputNumber, Select } from "antd";

import { ICategoryGroup } from "../../../interfaces";
import { useUserSelect } from "../../../hooks/useUserSelect";

export const CategoryGroupCreate: React.FC<IResourceComponentsProps> = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm<ICategoryGroup>();
  const { selectProps: userSelectProps } = useUserSelect();

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
        <Form.Item label={translate("panel.category.field.position", "Position")} name="position" initialValue={0}>
          <InputNumber min={0} />
        </Form.Item>
        <Form.Item label={translate("panel.category.field.user", "User")} name="userId">
          <Select {...userSelectProps} allowClear />
        </Form.Item>
      </Form>
    </Create>
  );
};
