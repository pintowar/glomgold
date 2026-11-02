import { useTranslate } from "@refinedev/core";

import { ProfileInfoCard } from "@/components/panel/profile/ProfileInfoCard";
import { ProfilePasswordCard } from "@/components/panel/profile/ProfilePasswordCard";
import { PageHeader } from "@/components/common/PageHeader";
import { API_URL } from "@/constants";
import { useLabelValueOptions } from "@/hooks/useLabelValueOptions";

export const ProfilePanel = () => {
  const translate = useTranslate();
  const localeOptions = useLabelValueOptions(`${API_URL}/panel/locales`);
  const timezonesOptions = useLabelValueOptions(`${API_URL}/panel/timezones`);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={translate("panel.profile.title", "Profile")} />
      <ProfileInfoCard localeOptions={localeOptions} timezonesOptions={timezonesOptions} />
      <ProfilePasswordCard />
    </div>
  );
};
