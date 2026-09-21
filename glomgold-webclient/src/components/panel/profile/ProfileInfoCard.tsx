import React, { useEffect } from "react";

import { Card, Form, Input, Button, Select } from "antd";

import { useApiUrl, useCustomMutation } from "@refinedev/core";

import { useQueryClient } from "@tanstack/react-query";
import { successPayload } from "../../../utils/notify";
import type { ProfileForm, ProfileInfo } from "./types";

interface ProfileInfoCardProps {
  localeOptions: { label: string; value: string }[];
  timezonesOptions: { label: string; value: string }[];
  initialProfile: ProfileInfo | undefined;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({
  localeOptions,
  timezonesOptions,
  initialProfile,
}) => {
  const apiUrl = useApiUrl();
  const [profileForm] = Form.useForm<ProfileForm>();
  const { mutate: updateProfile } = useCustomMutation<ProfileForm>();

  const queryClient = useQueryClient();

  useEffect(() => {
    if (initialProfile) {
      profileForm.setFieldsValue({
        name: initialProfile.name,
        email: initialProfile.email,
        locale: initialProfile.locale,
        timezone: initialProfile.timezone,
      });
    }
  }, [initialProfile, profileForm]);

  const onFinishProfile = async (form: ProfileForm) => {
    updateProfile(
      {
        url: `${apiUrl}/panel/profile`,
        method: "patch",
        values: form,
        successNotification: successPayload("Profile updated."),
        // 409 branch needs the server error — errorPayload can't express it, so it stays inline.
        errorNotification: (error?: { statusCode?: number }) => ({
          message: "Operation Error",
          description: error?.statusCode === 409 ? "E-mail already in use." : "Could not update profile.",
          type: "error",
        }),
      },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: ["panel-profile"] });
        },
      }
    );
  };

  return (
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
  );
};
