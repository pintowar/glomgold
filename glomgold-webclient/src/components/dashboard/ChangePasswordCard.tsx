import { Controller, useForm } from "react-hook-form";
import { useCustomMutation, useTranslate } from "@refinedev/core";

import { SelectInput, TextInput } from "../common/form-fields";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { API_URL } from "../../constants";
import { useUserSelect } from "../../hooks/useUserSelect";
import { errorPayload, successPayload } from "../../utils/notify";

interface PasswordForm {
  userId?: number;
  password?: string;
}

export const ChangePasswordCard = () => {
  const translate = useTranslate();
  const { mutate, mutation } = useCustomMutation();
  const { options: userOptions } = useUserSelect();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PasswordForm>({});

  const onSubmit = (values: PasswordForm) =>
    mutate({
      url: `${API_URL}/users/${values.userId}/password`,
      method: "patch",
      values,
      successNotification: successPayload("Password changed for selected user."),
      errorNotification: errorPayload("Could not change password for selected user."),
    });

  return (
    <Card className="h-[300px]">
      <CardHeader>
        <CardTitle className="text-center">{translate("dashboard.changePassword", "Change Password")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Controller
            control={control}
            name="userId"
            rules={{ required: true }}
            render={({ field }) => (
              <SelectInput
                label="User"
                placeholder="Select user"
                options={userOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.userId?.message}
              />
            )}
          />
          <TextInput
            type="password"
            label="Password"
            error={errors.password?.message}
            {...register("password", { required: true })}
          />
          <Button type="submit" disabled={mutation.isPending}>
            {translate("buttons.submit", "Submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
