import { useCustom, useTranslate } from "@refinedev/core";

import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

interface ManagementInfo {
  git?: {
    branch?: string;
    build?: { version?: string };
  };
}

export const ManagementInfoCard = () => {
  const translate = useTranslate();
  const {
    result,
    query: { isLoading, isError },
  } = useCustom<ManagementInfo>({
    url: "/api/management/info",
    method: "get",
    queryOptions: { queryKey: ["management-info"], staleTime: 5 * 60 * 1000 },
  });

  return (
    <Card className="h-[300px]">
      <CardHeader>
        <CardTitle className="text-center">{translate("dashboard.managementInfo", "Management Info")}</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError ? (
          <p className="text-sm text-muted-foreground">Unavailable</p>
        ) : (
          <ul className="list-inside list-disc text-sm">
            <li>Branch: {result?.data?.git?.branch ?? "—"}</li>
            <li>Version: {result?.data?.git?.build?.version ?? "—"}</li>
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
