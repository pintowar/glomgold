import React from "react";

import { Card, Form, Input, Button } from "antd";

import { useApiUrl, useCustomMutation, useLogout, useTranslate } from "@refinedev/core";

import { errorPayload, successPayload } from "../../../utils/notify";
import type { ProfilePasswordForm } from "./types";

export const ProfilePasswordCard: React.FC = () => {
  const apiUrl = useApiUrl();
  const translate = useTranslate();
  const { mutate: logout } = useLogout();
  const [passwordForm] = Form.useForm<ProfilePasswordForm>();
  const { mutate: changePassword } = useCustomMutation<ProfilePasswordForm>();

  const onFinishPassword = async (form: ProfilePasswordForm) => {
    changePassword(
      {
        url: `${apiUrl}/panel/profile/password`,
        method: "post",
        values: { passwords: form },
        successNotification: successPayload(translate("panel.profile.passwordChanged", "Password changed.")),
        errorNotification: errorPayload(translate("panel.profile.passwordError", "Could not change password.")),
      },
      {
        onSuccess: () => logout(),
      }
    );
  };

  return (
    <Card title={translate("panel.profile.passwordTitle", "Change Password")} variant="borderless">
      <Form form={passwordForm} name="user-form" onFinish={onFinishPassword}>
        <Form.Item
          label={translate("panel.profile.field.actualPassword", "Actual Password")}
          name="actualPassword"
          rules={[{ required: true }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          label={translate("panel.profile.field.newPassword", "New Password")}
          name="newPassword"
          rules={[{ required: true }]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            {translate("panel.profile.change", "Change")}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
