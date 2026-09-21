import React from "react";
import { Row } from "antd";
import { useApiUrl, useCustom } from "@refinedev/core";
import { useLabelValueOptions } from "../../../hooks/useLabelValueOptions";
import { ProfileInfoCard } from "../../../components/panel/profile/ProfileInfoCard";
import { ProfilePasswordCard } from "../../../components/panel/profile/ProfilePasswordCard";
import type { ProfileInfo } from "../../../components/panel/profile/types";

export const ProfilePanel: React.FC = () => {
  const apiUrl = useApiUrl();
  const { result: profile } = useCustom<ProfileInfo>({
    url: `${apiUrl}/panel/profile`,
    method: "get",
    queryOptions: { queryKey: ["panel-profile"] },
  });
  const localeOptions = useLabelValueOptions(`${apiUrl}/panel/locales`);
  const timezonesOptions = useLabelValueOptions(`${apiUrl}/panel/timezones`);

  return (
    <div className="card-row">
      <Row gutter={[24, 24]}>
        <ProfileInfoCard
          localeOptions={localeOptions}
          timezonesOptions={timezonesOptions}
          initialProfile={profile?.data}
        />
        <ProfilePasswordCard />
      </Row>
    </div>
  );
};
