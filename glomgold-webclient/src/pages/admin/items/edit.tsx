import React from "react";
import { IResourceComponentsProps } from "@refinedev/core";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

import { IItem } from "../../../interfaces";
import { ITEM_TYPES } from "../../../constants";
import { ItemTypeIcon } from "../../../components/common/ItemTypeIcon";
import { useUserSelect } from "../../../hooks/useUserSelect";

export const ItemEdit: React.FC<IResourceComponentsProps> = () => {
  const { formProps, saveButtonProps, query } = useForm<IItem>({
    warnWhenUnsavedChanges: true,
  });

  const postData = query?.data?.data;
  const { selectProps: userSelectProps } = useUserSelect(postData?.userId);

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
          label="Type"
          name="itemType"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select options={ITEM_TYPES.map((value) => ({ value, label: <ItemTypeIcon type={value} /> }))} />
        </Form.Item>
        <Form.Item
          label="Description"
          name="description"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Value"
          name="value"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Year"
          name="year"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="Month"
          name="month"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label="User"
          name="userId"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select {...userSelectProps} />
        </Form.Item>
      </Form>
    </Edit>
  );
};
