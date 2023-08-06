import React, { useMemo } from "react";
import { IResourceComponentsProps, useApiUrl, useCustom } from "@refinedev/core";

import { Create, useForm } from "@refinedev/antd";
import { Form, Input, Checkbox, Select } from "antd";

import { IUser } from "../../../interfaces";

export const UserCreate: React.FC<IResourceComponentsProps> = () => {
  const apiUrl = useApiUrl();
  const { formProps, saveButtonProps } = useForm<IUser>({
    // warnWhenUnsavedChanges: true,
  });

  const { data: locales } = useCustom({
    url: `${apiUrl}/users/locales`,
    method: "get",
  });

  const localeOptions = useMemo(() => {
    return (locales?.data ?? []).map((it: string) => ({ label: it, value: it }));
  }, [locales]);

  const { data: timezones } = useCustom({
    url: `${apiUrl}/users/timezones`,
    method: "get",
  });

  const timezonesOptions = useMemo(() => {
    return (timezones?.data ?? []).map((it: string) => ({ label: it, value: it }));
  }, [timezones]);

  return (
    <Create saveButtonProps={saveButtonProps}>
      <Form {...formProps} layout="vertical">
        <Form.Item label="Name" name="name" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Username" name="username" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="E-mail" name="email" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label="Locale" name="locale" rules={[{ required: true }]} initialValue="en_US">
          <Select options={localeOptions} showSearch />
        </Form.Item>
        <Form.Item label="Timezone" name="timezone" rules={[{ required: true }]} initialValue="UTC">
          <Select options={timezonesOptions} showSearch />
        </Form.Item>
        <Form.Item label="Enabled" name="enabled" valuePropName="checked">
          <Checkbox />
        </Form.Item>
        <Form.Item label="Admin" name="admin" valuePropName="checked">
          <Checkbox />
        </Form.Item>
      </Form>
    </Create>
  );
};
