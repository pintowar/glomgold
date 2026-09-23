import React, { useEffect } from "react";

import { Card, Form, Input, Button, Select } from "antd";

import { useForm } from "@refinedev/antd";

import { PANEL_QUERY_KEYS } from "../../../constants";
import { usePanelInvalidate } from "../../../hooks/usePanelInvalidate";
import { successPayload } from "../../../utils/notify";
import type { ProfileForm } from "./types";

interface ProfileInfoCardProps {
  localeOptions: { label: string; value: string }[];
  timezonesOptions: { label: string; value: string }[];
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ localeOptions, timezonesOptions }) => {
  const invalidatePanel = usePanelInvalidate();

  const {
    form: profileForm,
    formProps,
    saveButtonProps,
    query,
  } = useForm<ProfileForm>({
    resource: "panel-profile",
    action: "edit",
    id: "profile",
    redirect: false,
    successNotification: successPayload("Profile updated."),
    // 409 branch needs the server error — errorPayload can't express it, so it stays inline.
    errorNotification: (error) => ({
      message: "Operation Error",
      description: error?.statusCode === 409 ? "E-mail already in use." : "Could not update profile.",
      type: "error",
    }),
    onMutationSuccess: () => void invalidatePanel(PANEL_QUERY_KEYS.profile),
  });

  const liveProfile = query?.data?.data;

  useEffect(() => {
    if (liveProfile) {
      profileForm.setFieldsValue({
        name: liveProfile.name,
        email: liveProfile.email,
        locale: liveProfile.locale,
        timezone: liveProfile.timezone,
      });
    }
  }, [liveProfile, profileForm]);

  return (
    <Card title={"Profile Information"} variant="borderless">
      <Form {...formProps} name="profile-form">
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
          <Button type="primary" htmlType="submit" {...saveButtonProps}>
            Save
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
