import React from "react";

import { Card, Form, Input, Button } from "antd";

import { useApiUrl, useCustomMutation, useLogout } from "@refinedev/core";

import { errorPayload, successPayload } from "../../../utils/notify";
import type { ProfilePasswordForm } from "./types";

export const ProfilePasswordCard: React.FC = () => {
  const apiUrl = useApiUrl();
  const { mutate: logout } = useLogout();
  const [passwordForm] = Form.useForm<ProfilePasswordForm>();
  const { mutate: changePassword } = useCustomMutation<ProfilePasswordForm>();

  const onFinishPassword = async (form: ProfilePasswordForm) => {
    changePassword(
      {
        url: `${apiUrl}/panel/profile/password`,
        method: "post",
        values: { passwords: form },
        successNotification: successPayload("Password changed."),
        errorNotification: errorPayload("Could not change password."),
      },
      {
        onSuccess: () => logout(),
      }
    );
  };

  return (
    <Card title={"Change Password"} variant="borderless">
      <Form form={passwordForm} name="user-form" onFinish={onFinishPassword}>
        <Form.Item label="Actual Password" name="actualPassword" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item label="New Password" name="newPassword" rules={[{ required: true }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Change
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
