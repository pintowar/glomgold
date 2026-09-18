import React, { useMemo } from "react";
import { IResourceComponentsProps, useApiUrl, useCustom } from "@refinedev/core";

import { Edit, useForm } from "@refinedev/antd";
import { Form, Input, Checkbox, Select } from "antd";

import { IUser } from "../../../interfaces";

export const UserEdit: React.FC<IResourceComponentsProps> = () => {
  const apiUrl = useApiUrl();
  const { formProps, saveButtonProps } = useForm<IUser>({
    warnWhenUnsavedChanges: true,
  });

  const { result: locales } = useCustom({
    url: `${apiUrl}/users/locales`,
    method: "get",
  });

  const localeOptions = useMemo(() => {
    const data = locales?.data;
    return (Array.isArray(data) ? data : []).map((it: string) => ({ label: it, value: it }));
  }, [locales]);

  const { result: timezones } = useCustom({
    url: `${apiUrl}/users/timezones`,
    method: "get",
  });

  const timezonesOptions = useMemo(() => {
    const data = timezones?.data;
    return (Array.isArray(data) ? data : []).map((it: string) => ({ label: it, value: it }));
  }, [timezones]);

  return (
    <Edit saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="ID" name="id" hidden={true}>
          <Input />
        </Form.Item>
        <Form.Item label="Version" name="version" hidden={true}>
          <Input />
        </Form.Item>
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Username" name="username" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="E-mail" name="email" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Locale" name="locale" rules={[{ required: true }]}>
          <Select options={localeOptions} showSearch />
        </Form.Item>
        <Form.Item label="Timezone" name="timezone" rules={[{ required: true }]}>
          <Select options={timezonesOptions} showSearch />
        </Form.Item>
        <Form.Item label="Enabled" name="enabled" valuePropName="checked">
          <Checkbox />
        </Form.Item>
        <Form.Item label="Admin" name="admin" valuePropName="checked">
          <Checkbox />
        </Form.Item>
      </Form>
    </Edit>
  );
};
