import React from "react";
import { useApiUrl, useCustomMutation } from "@refinedev/core";
import { Button, Card, Form, Input, Select } from "antd";
import { useSelect } from "@refinedev/antd";
import { IUser } from "../../interfaces";

export const ChangePasswordCard: React.FC = () => {
  const apiUrl = useApiUrl();
  const { mutate } = useCustomMutation<{ password: string }>();

  const onFinish = async (values: PasswordForm) => {
    mutate({
      url: `${apiUrl}/users/${values.userId}/password`,
      method: "patch",
      values,
      successNotification: () => ({
        message: "Successfuly Operation",
        description: "Password changed for selected user.",
        type: "success",
      }),
      errorNotification: () => ({
        message: "Operation Error",
        description: "Could not change password for selected user.",
        type: "error",
      }),
    });
  };

  interface PasswordForm {
    userId: number;
    password: string;
  }

  const [form] = Form.useForm<PasswordForm>();

  const { selectProps } = useSelect<IUser>({
    resource: "users",
    optionLabel: "name",
    optionValue: "id",
  });

  return (
    <Card title="Change Password" style={{ height: "300px", borderRadius: "15px" }} headStyle={{ textAlign: "center" }}>
      <Form form={form} name="control-hooks" onFinish={onFinish}>
        <Form.Item label="User" name="userId" rules={[{ required: true }]}>
          <Select placeholder="Select user" {...selectProps} />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
