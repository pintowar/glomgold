import { useTranslate } from "@refinedev/core";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { CheckboxInput, SelectInput, TextInput } from "../common/form-fields";
import { useLabelValueOptions } from "../../hooks/useLabelValueOptions";
import { API_URL } from "../../constants";
import type { IUser } from "../../interfaces";

interface UserFormFieldsProps {
  register: UseFormRegister<IUser>;
  control: Control<IUser>;
  errors: FieldErrors<IUser>;
}

export const UserFormFields = ({ register, control, errors }: UserFormFieldsProps) => {
  const translate = useTranslate();
  const localeOptions = useLabelValueOptions(`${API_URL}/users/locales`);
  const timezonesOptions = useLabelValueOptions(`${API_URL}/users/timezones`);

  return (
    <>
      <TextInput
        label={translate("users.field.name", "Name")}
        error={errors.name?.message}
        {...register("name", { required: true })}
      />
      <TextInput
        label={translate("users.field.username", "Username")}
        error={errors.username?.message}
        {...register("username", { required: true })}
      />
      <TextInput
        label={translate("users.field.email", "E-mail")}
        error={errors.email?.message}
        {...register("email", { required: true })}
      />
      <Controller
        control={control}
        name="locale"
        rules={{ required: true }}
        render={({ field, fieldState }) => (
          <SelectInput
            label={translate("users.field.locale", "Locale")}
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
            label={translate("users.field.timezone", "Timezone")}
            options={timezonesOptions}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="enabled"
        render={({ field }) => (
          <CheckboxInput
            label={translate("users.field.enabled", "Enabled")}
            checked={!!field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="admin"
        render={({ field }) => (
          <CheckboxInput
            label={translate("users.field.admin", "Admin")}
            checked={!!field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
    </>
  );
};
