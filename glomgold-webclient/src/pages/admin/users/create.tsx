import React from "react";
import { IResourceComponentsProps, useApiUrl } from "@refinedev/core";

import { Create, useForm } from "@refinedev/antd";
import { Form } from "antd";

import { IUser } from "../../../interfaces";
import { UserFormFields } from "../../../components/admin/UserFormFields";

export const UserCreate: React.FC<IResourceComponentsProps> = () => {
  const apiUrl = useApiUrl();
  const { formProps, saveButtonProps } = useForm<IUser>({
    // warnWhenUnsavedChanges: true,
  });

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <UserFormFields apiUrl={apiUrl} localeInitialValue="en_US" timezoneInitialValue="UTC" />
      </Form>
    </Create>
  );
};
