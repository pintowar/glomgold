import React from "react";
import { useApiUrl } from "@refinedev/core";
import { axiosInstance } from "../../authProvider";
import { Button, Card, Form, Input, notification, Select } from "antd";
import { useSelect } from "@refinedev/antd";
import { IUser } from "../../interfaces";

export const ChangePasswordCard: React.FC = () => {
  const apiUrl = useApiUrl();

  const onFinish = async (values: PasswordForm) => {
    const { status } = await axiosInstance.patch(`${apiUrl}/users/${values.userId}/password`, {
      password: values.password,
    });
    if (status === 200) {
      notification["success"]({
        message: "Successfuly Operation",
        description: "Password changed for selected user.",
      });
    } else {
      notification["error"]({
        message: "Operation Error",
        description: "Could not change password for selected user.",
      });
    }
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
