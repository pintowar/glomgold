import React, { useEffect, useMemo } from "react";

import { Row, Col, Card, Form, Input, Button, Select } from "antd";

import { useApiUrl, useCustom, useCustomMutation, useLogout } from "@refinedev/core";

import { useQueryClient } from "@tanstack/react-query";

interface PasswordForm {
  actualPassword: string;
  newPassword: string;
}

interface ProfileInfo {
  name: string;
  email: string;
  locale: string;
  timezone: string;
}

type ProfileForm = ProfileInfo;

export const ProfilePanel: React.FC = () => {
  const apiUrl = useApiUrl();
  const { mutate: logout } = useLogout();
  const [passwordForm] = Form.useForm<PasswordForm>();
  const [profileForm] = Form.useForm<ProfileForm>();
  const { mutate: changePassword } = useCustomMutation<PasswordForm>();
  const { mutate: updateProfile } = useCustomMutation<ProfileForm>();

  const queryClient = useQueryClient();

  const { result: profile } = useCustom<ProfileInfo>({
    url: `${apiUrl}/panel/profile`,
    method: "get",
    queryOptions: {
      queryKey: ["panel-profile"],
    },
  });

  useEffect(() => {
    const data = profile?.data;
    if (data) {
      profileForm.setFieldsValue({
        name: data.name,
        email: data.email,
        locale: data.locale,
        timezone: data.timezone,
      });
    }
  }, [profile, profileForm]);

  const { result: locales } = useCustom({
    url: `${apiUrl}/panel/locales`,
    method: "get",
  });

  const localeOptions = useMemo(() => {
    const data = locales?.data;
    return (Array.isArray(data) ? data : []).map((it: string) => ({ label: it, value: it }));
  }, [locales]);

  const { result: timezones } = useCustom({
    url: `${apiUrl}/panel/timezones`,
    method: "get",
  });

  const timezonesOptions = useMemo(() => {
    const data = timezones?.data;
    return (Array.isArray(data) ? data : []).map((it: string) => ({ label: it, value: it }));
  }, [timezones]);

  const onFinishProfile = async (form: ProfileForm) => {
    updateProfile(
      {
        url: `${apiUrl}/panel/profile`,
        method: "patch",
        values: form,
        successNotification: () => ({
          message: "Successfuly Operation",
          description: "Profile updated.",
          type: "success",
        }),
        errorNotification: (error?: { statusCode?: number }) => ({
          message: "Operation Error",
          description: error?.statusCode === 409 ? "E-mail already in use." : "Could not update profile.",
          type: "error",
        }),
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["panel-profile"] });
        },
      }
    );
  };

  const onFinishPassword = async (form: PasswordForm) => {
    changePassword(
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
          <Card title={"Profile Information"} variant="borderless">
            <Form form={profileForm} name="profile-form" onFinish={onFinishProfile}>
              <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item label="E-mail" name="email" rules={[{ required: true, type: "email" }]}>
                <Input />
              </Form.Item>
              <Form.Item label="Locale" name="locale" rules={[{ required: true }]}>
                <Select options={localeOptions} showSearch />
              </Form.Item>
              <Form.Item label="Timezone" name="timezone" rules={[{ required: true }]}>
                <Select options={timezonesOptions} showSearch />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  Save
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
        <Col span={24}>
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
        </Col>
      </Row>
    </div>
  );
};
