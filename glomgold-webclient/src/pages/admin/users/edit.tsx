import React from "react";
import { IResourceComponentsProps, useApiUrl } from "@refinedev/core";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input } from "antd";

import { IUser } from "../../../interfaces";
import { UserFormFields } from "../../../components/admin/UserFormFields";

export const UserEdit: React.FC<IResourceComponentsProps> = () => {
  const apiUrl = useApiUrl();
  const { formProps, saveButtonProps } = useForm<IUser>({
    warnWhenUnsavedChanges: true,
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
        <UserFormFields apiUrl={apiUrl} />
      </Form>
    </Edit>
  );
};
