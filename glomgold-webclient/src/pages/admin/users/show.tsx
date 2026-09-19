import React from "react";

import { useShow, IResourceComponentsProps } from "@refinedev/core";

import { Show } from "@refinedev/antd";

import { IUser } from "../../../interfaces";
import { ShowField } from "../../../components/common/ShowField";

export const UserShow: React.FC<IResourceComponentsProps> = () => {
  const {
    result: record,
    query: { isLoading },
  } = useShow<IUser>();

  return (
    <Show isLoading={isLoading}>
      <ShowField label="Id">{record?.id}</ShowField>

      <ShowField label="Name">{record?.name}</ShowField>

      <ShowField label="Username">{record?.username}</ShowField>

      <ShowField label="E-Mail">{record?.email}</ShowField>

      <ShowField label="Locale">{record?.locale}</ShowField>

      <ShowField label="Timezone">{record?.timezone}</ShowField>

      <ShowField label="Enabled">{record?.enabled}</ShowField>

      <ShowField label="Admin">{record?.admin}</ShowField>
    </Show>
  );
};
