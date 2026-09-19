import React from "react";

import { useShow, IResourceComponentsProps, useOne } from "@refinedev/core";

import { Show } from "@refinedev/antd";

import { IItem, IUser } from "../../../interfaces";
import { ShowField } from "../../../components/common/ShowField";

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
      <ShowField label="Id">{record?.id}</ShowField>

      <ShowField label="Description">{record?.description}</ShowField>

      <ShowField label="Value">{record?.value}</ShowField>

      <ShowField label="Period">
        {record?.year}-{record?.month}
      </ShowField>

      <ShowField label="User">{userIsLoading ? "Loading..." : userData?.name}</ShowField>
    </Show>
  );
};
