import { useForm } from "react-hook-form";
import { useCustomMutation, useLogout, useTranslate } from "@refinedev/core";

import { TextInput } from "../../common/form-fields";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { API_URL } from "../../../constants";
import { errorPayload, successPayload } from "../../../utils/notify";
import type { ProfilePasswordForm } from "./types";

export const ProfilePasswordCard = () => {
  const translate = useTranslate();
  const { mutate: logout } = useLogout();
  const { mutate: changePassword, mutation } = useCustomMutation<ProfilePasswordForm>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfilePasswordForm>();

  const onSubmit = (values: ProfilePasswordForm) =>
    changePassword(
      {
        url: `${API_URL}/panel/profile/password`,
        method: "post",
        values,
        successNotification: successPayload(translate("panel.profile.passwordChanged", "Password changed.")),
        errorNotification: errorPayload(translate("panel.profile.passwordError", "Could not change password.")),
      },
      { onSuccess: () => logout() }
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{translate("panel.profile.passwordTitle", "Change Password")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex max-w-xl flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <TextInput
            type="password"
            label={translate("panel.profile.field.actualPassword", "Actual Password")}
            error={errors.actualPassword?.message}
            {...register("actualPassword", { required: true })}
          />
          <TextInput
            type="password"
            label={translate("panel.profile.field.newPassword", "New Password")}
            error={errors.newPassword?.message}
            {...register("newPassword", { required: true })}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {translate("panel.profile.change", "Change")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
