import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useCustom, useTranslate, useUpdate } from "@refinedev/core";

import { SelectInput, TextInput } from "../../common/form-fields";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { PANEL_QUERY_KEYS, PANEL_URLS } from "../../../constants";
import { usePanelInvalidate } from "../../../hooks/usePanelInvalidate";
import { successPayload } from "../../../utils/notify";
import type { ProfileForm } from "./types";

interface ProfileInfoCardProps {
  localeOptions: { label: string; value: string }[];
  timezonesOptions: { label: string; value: string }[];
}

export const ProfileInfoCard = ({ localeOptions, timezonesOptions }: ProfileInfoCardProps) => {
  const translate = useTranslate();
  const invalidatePanel = usePanelInvalidate();
  const { mutate: updateProfile } = useUpdate();

  const { result: profile } = useCustom<ProfileForm>({
    url: PANEL_URLS.profile,
    method: "get",
    queryOptions: { queryKey: [PANEL_QUERY_KEYS.profile] },
  });

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileForm>();

  // `useCustom().result` is a fresh object on every render, so depending on it
  // would reset the form (and the typed values) on each keystroke.
  const profileData = profile?.data;

  useEffect(() => {
    if (profileData?.name) reset(profileData);
  }, [profileData, reset]);

  const onSubmit = (values: ProfileForm) =>
    updateProfile(
      {
        resource: "panel-profile",
        id: "profile",
        values,
        successNotification: successPayload(translate("panel.profile.updated", "Profile updated.")),
        errorNotification: (error) => ({
          message: translate("common.error", "Operation Error"),
          description:
            error?.statusCode === 409
              ? translate("panel.profile.emailInUse", "E-mail already in use.")
              : translate("panel.profile.updateError", "Could not update profile."),
          type: "error",
        }),
      },
      { onSuccess: () => void invalidatePanel(PANEL_QUERY_KEYS.profile) }
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{translate("panel.profile.infoTitle", "Profile Information")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex max-w-xl flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            label={translate("panel.profile.field.name", "Name")}
            error={errors.name?.message}
            {...register("name", { required: true })}
          />
          <TextInput
            type="email"
            label={translate("panel.profile.field.email", "E-mail")}
            error={errors.email?.message}
            {...register("email", { required: true })}
          />
          <Controller
            control={control}
            name="locale"
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <SelectInput
                label={translate("panel.profile.field.locale", "Locale")}
                options={localeOptions}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="timezone"
            rules={{ required: true }}
            render={({ field, fieldState }) => (
              <SelectInput
                label={translate("panel.profile.field.timezone", "Timezone")}
                options={timezonesOptions}
                value={field.value}
                onChange={field.onChange}
                error={fieldState.error?.message}
              />
            )}
          />
          <Button type="submit">{translate("panel.profile.save", "Save")}</Button>
        </form>
      </CardContent>
    </Card>
  );
};
