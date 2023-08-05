import React from "react";

import { Row, Col, Card, Form, Input, Button } from "antd";

import { useApiUrl, useCustomMutation, useLogout } from "@refinedev/core";

interface PasswordForm {
  actualPassword: string;
  newPassword: string;
}

export const ProfilePanel: React.FC = () => {
  const apiUrl = useApiUrl();
  const { mutate: logout } = useLogout();
  const [form] = Form.useForm<PasswordForm>();
  const { mutate } = useCustomMutation<PasswordForm>();

  const onFinish = async (form: PasswordForm) => {
    mutate(
      {
        url: `${apiUrl}/panel/profile/password`,
        method: "post",
        values: { passwords: form },
        successNotification: () => ({
          message: "Successfuly Operation",
          description: "Password changed.",
          type: "success",
        }),
        errorNotification: () => ({
          message: "Operation Error",
          description: "Could not change password.",
          type: "error",
        }),
      },
      {
        onSuccess: () => logout(),
      }
    );
  };

  return (
    <div className="card-row">
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card title={"Change Password"} bordered={false}>
            <Form form={form} name="user-form" onFinish={onFinish}>
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
        </Col>
      </Row>
    </div>
  );
};
