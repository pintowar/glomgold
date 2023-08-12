import React from "react";
import { IResourceComponentsProps } from "@refinedev/core";

import { Edit, useForm, useSelect } from "@refinedev/antd";
import { Form, Input, Select } from "antd";
import { DollarOutlined, ShoppingCartOutlined } from "@ant-design/icons";

import { IItem, IUser } from "../../../interfaces";

export const ItemEdit: React.FC<IResourceComponentsProps> = () => {
  const { formProps, saveButtonProps, queryResult } = useForm<IItem>({
    warnWhenUnsavedChanges: true,
  });

  const postData = queryResult?.data?.data;
  const { selectProps: userSelectProps } = useSelect<IUser>({
    resource: "users",
    optionLabel: "name",
    optionValue: "id",
    defaultValue: postData?.userId,
  });

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
          <Select>
            <Select.Option value="EXPENSE">
              <ShoppingCartOutlined />
            </Select.Option>
            <Select.Option value="INCOME">
              <DollarOutlined />
            </Select.Option>
          </Select>
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
