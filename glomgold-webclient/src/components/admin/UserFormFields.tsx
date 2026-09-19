import React from "react";
import { Form, Input, Checkbox, Select } from "antd";
import { useLabelValueOptions } from "../../hooks/useLabelValueOptions";

interface UserFormFieldsProps {
  apiUrl: string;
  localeInitialValue?: string;
  timezoneInitialValue?: string;
}

export const UserFormFields: React.FC<UserFormFieldsProps> = ({ apiUrl, localeInitialValue, timezoneInitialValue }) => {
  const localeOptions = useLabelValueOptions(`${apiUrl}/users/locales`);
  const timezonesOptions = useLabelValueOptions(`${apiUrl}/users/timezones`);

  return (
    <>
      <Form.Item label="Name" name="name" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Username" name="username" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="E-mail" name="email" rules={[{ required: true }]}>
        <Input />
      </Form.Item>
      <Form.Item label="Locale" name="locale" rules={[{ required: true }]} initialValue={localeInitialValue}>
        <Select options={localeOptions} showSearch />
      </Form.Item>
      <Form.Item label="Timezone" name="timezone" rules={[{ required: true }]} initialValue={timezoneInitialValue}>
        <Select options={timezonesOptions} showSearch />
      </Form.Item>
      <Form.Item label="Enabled" name="enabled" valuePropName="checked">
        <Checkbox />
      </Form.Item>
      <Form.Item label="Admin" name="admin" valuePropName="checked">
        <Checkbox />
      </Form.Item>
    </>
  );
};
