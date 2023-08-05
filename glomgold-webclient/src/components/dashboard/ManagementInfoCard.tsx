import React, { useMemo } from "react";
import { useCustom } from "@refinedev/core";
import { Card, Space } from "antd";

export const ManagementInfoCard: React.FC = () => {
  const { data } = useCustom({
    url: `/api/management/info`,
    method: "get",
  });

  const appInfo = useMemo(() => {
    const branch = data?.data?.git?.branch;
    const version = data?.data?.git?.build?.version;
    return { branch, version };
  }, [data]);

  return (
    <Card title="Management Info" style={{ height: "300px", borderRadius: "15px" }} headStyle={{ textAlign: "center" }}>
      <Space align="center" direction="horizontal">
        <ul>
          <li>Branch: {appInfo.branch}</li>
          <li>Version: {appInfo.version}</li>
        </ul>
      </Space>
    </Card>
  );
};
