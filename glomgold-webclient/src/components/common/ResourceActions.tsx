import React from "react";
import { Space } from "antd";
import { DeleteButton, EditButton } from "@refinedev/antd";

export const ResourceActions: React.FC<{ recordId: number | string }> = ({ recordId }) => (
  <Space>
    <EditButton hideText size="small" recordItemId={recordId} />
    <DeleteButton hideText size="small" recordItemId={recordId} />
  </Space>
);
