import React from "react";
import { useApiUrl, useCustomMutation } from "@refinedev/core";
import { Button, Card, Form, Input, Select } from "antd";
import { errorPayload, successPayload } from "../../utils/notify";
import { useUserSelect } from "../../hooks/useUserSelect";

interface PasswordForm {
  userId: number;
  password: string;
}

export const ChangePasswordCard: React.FC = () => {
  const apiUrl = useApiUrl();
  const { mutate } = useCustomMutation<{ password: string }>();

  const onFinish = async (values: PasswordForm) => {
    mutate({
      url: `${apiUrl}/users/${values.userId}/password`,
      method: "patch",
      values,
      successNotification: successPayload("Password changed for selected user."),
      errorNotification: errorPayload("Could not change password for selected user."),
    });
  };

  const [form] = Form.useForm<PasswordForm>();

  const { selectProps } = useUserSelect();

  return (
    <Card
      title="Change Password"
      style={{ height: "300px", borderRadius: "15px" }}
      styles={{ header: { textAlign: "center" } }}
    >
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
