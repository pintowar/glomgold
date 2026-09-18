import React from "react";

import { useShow, IResourceComponentsProps, useOne } from "@refinedev/core";

import { Show } from "@refinedev/antd";
import { Typography } from "antd";

import { IItem, IUser } from "../../../interfaces";

const { Title, Text } = Typography;

export const ItemShow: React.FC<IResourceComponentsProps> = () => {
  const {
    result: record,
    query: { isLoading },
  } = useShow<IItem>();

  const {
    result: userData,
    query: { isLoading: userIsLoading },
  } = useOne<IUser>({
    resource: "users",
    id: record?.userId ?? "",
    queryOptions: {
      enabled: !!record,
    },
  });

  return (
    <Show isLoading={isLoading}>
      <Title level={5}>Id</Title>
      <Text>{record?.id}</Text>

      <Title level={5}>Description</Title>
      <Text>{record?.description}</Text>

      <Title level={5}>Value</Title>
      <Text>{record?.value}</Text>

      <Title level={5}>Period</Title>
      <Text>
        {record?.year}-{record?.month}
      </Text>

      <Title level={5}>User</Title>
      <Text>{userIsLoading ? "Loading..." : userData?.name}</Text>
    </Show>
  );
};
