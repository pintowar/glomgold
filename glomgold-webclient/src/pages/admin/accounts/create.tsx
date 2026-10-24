import React from "react";
import { IResourceComponentsProps, useTranslate } from "@refinedev/core";

import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Select } from "antd";

import { IAccount } from "../../../interfaces";
import { ACCOUNT_TYPES } from "../../../constants";
import { useUserSelect } from "../../../hooks/useUserSelect";

export const AccountCreate: React.FC<IResourceComponentsProps> = () => {
  const translate = useTranslate();
  const { formProps, saveButtonProps } = useForm<IAccount>({
    // warnWhenUnsavedChanges: true,
  });
  const { selectProps: userSelectProps } = useUserSelect();

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item
          label={translate("panel.account.field.name", "Name")}
          name="name"
          rules={[
            {
              required: true,
              message: translate("panel.account.nameRequired", "Please input a name!"),
            },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={translate("panel.account.field.type", "Type")}
          name="type"
          initialValue="CHECKING"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Select
            options={ACCOUNT_TYPES.map((value) => ({
              value,
              label: translate(`panel.account.type.${value}`, value),
            }))}
          />
        </Form.Item>
        <Form.Item label={translate("panel.account.field.currency", "Currency")} name="currency">
          <Input maxLength={3} />
        </Form.Item>
        <Form.Item
          label={translate("panel.account.field.user", "User")}
          name="userId"
          rules={[
            {
              required: true,
              message: translate("panel.account.userRequired", "Please select an user!"),
            },
          ]}
        >
          <Select {...userSelectProps} />
        </Form.Item>
      </Form>
    </Create>
  );
};
