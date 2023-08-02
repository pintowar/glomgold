import React from "react";

import { useShow, IResourceComponentsProps } from "@refinedev/core";

import { Show } from "@refinedev/antd";
import { Typography } from "antd";

import { IUser } from "../../interfaces";

const { Title, Text } = Typography;

export const UserShow: React.FC<IResourceComponentsProps> = () => {
  const { queryResult } = useShow<IUser>();
  const { data, isLoading } = queryResult;
  const record = data?.data;

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>Id</Title>
      <Text>{record?.id}</Text>

      <Title level={5}>Name</Title>
      <Text>{record?.name}</Text>

      <Title level={5}>Username</Title>
      <Text>{record?.username}</Text>

      <Title level={5}>E-Mail</Title>
      <Text>{record?.email}</Text>

      <Title level={5}>Locale</Title>
      <Text>{record?.locale}</Text>

      <Title level={5}>Timezone</Title>
      <Text>{record?.timezone}</Text>

      <Title level={5}>Enabled</Title>
      <Text>{record?.enabled}</Text>

      <Title level={5}>Admin</Title>
      <Text>{record?.admin}</Text>
    </Show>
  );
};
