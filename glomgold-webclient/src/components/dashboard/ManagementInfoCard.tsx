import React, { useMemo } from "react";
import { useCustom } from "@refinedev/core";
import { Card, Space } from "antd";

export const ManagementInfoCard: React.FC = () => {
  const {
    result: data,
    query: { isLoading, isError },
  } = useCustom({
    url: `/api/management/info`,
    method: "get",
    queryOptions: { queryKey: ["management-info"], staleTime: 5 * 60 * 1000 },
  });

  const appInfo = useMemo(() => {
    const branch = data?.data?.git?.branch ?? "—";
    const version = data?.data?.git?.build?.version ?? "—";
    return { branch, version };
  }, [data]);

  if (isLoading)
    return (
      <Card
        title="Management Info"
        style={{ height: "300px", borderRadius: "15px" }}
        styles={{ header: { textAlign: "center" } }}
        loading
      />
    );
  if (isError)
    return (
      <Card
        title="Management Info"
        style={{ height: "300px", borderRadius: "15px" }}
        styles={{ header: { textAlign: "center" } }}
      >
        Unavailable
      </Card>
    );

  return (
    <Card
      title="Management Info"
      style={{ height: "300px", borderRadius: "15px" }}
      styles={{ header: { textAlign: "center" } }}
    >
      <Space align="center" direction="horizontal">
        <ul>
          <li>Branch: {appInfo.branch}</li>
          <li>Version: {appInfo.version}</li>
        </ul>
      </Space>
    </Card>
  );
};
