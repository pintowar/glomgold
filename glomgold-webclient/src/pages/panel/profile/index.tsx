import React from "react";
import { Row } from "antd";
import { useApiUrl } from "@refinedev/core";
import { useLabelValueOptions } from "../../../hooks/useLabelValueOptions";
import { ProfileInfoCard } from "../../../components/panel/profile/ProfileInfoCard";
import { ProfilePasswordCard } from "../../../components/panel/profile/ProfilePasswordCard";

export const ProfilePanel: React.FC = () => {
  const apiUrl = useApiUrl();
  const localeOptions = useLabelValueOptions(`${apiUrl}/panel/locales`);
  const timezonesOptions = useLabelValueOptions(`${apiUrl}/panel/timezones`);

  return (
    <div className="card-row">
      <Row gutter={[24, 24]}>
        <ProfileInfoCard
          localeOptions={localeOptions}
          timezonesOptions={timezonesOptions}
        />
        <ProfilePasswordCard />
      </Row>
    </div>
  );
};
