import React from "react";

import { Row, Col, Card, Form, Input, Button, notification } from "antd";

import { axiosInstance } from "../../../authProvider";
import { useApiUrl, useLogout } from "@refinedev/core";

interface PasswordForm {
  actualPassword: string;
  newPassword: string;
}

export const ProfilePanel: React.FC = () => {
  const apiUrl = useApiUrl();
  const { mutate: logout } = useLogout();
  const [form] = Form.useForm<PasswordForm>();

  const onFinish = async (values: PasswordForm) => {
    try {
      const { status } = await axiosInstance.post(`${apiUrl}/panel/profile/password`, values);
      if (status === 200) {
        notification["success"]({
          message: "Successfuly Operation",
          description: "Password changed.",
        });
        logout();
      } else {
        throw new Error(`Invalid status ${status}`);
      }
    } catch (err) {
      notification["error"]({
        message: "Operation Error",
        description: "Could not change password.",
      });
    }
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
