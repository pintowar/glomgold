import { useTranslate } from "@refinedev/core";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { SelectInput, TextInput, type SelectOption } from "../common/form-fields";
import { ACCOUNT_TYPES } from "../../constants";
import type { IAccount } from "../../interfaces";

interface AccountFormFieldsProps {
  register: UseFormRegister<IAccount>;
  control: Control<IAccount>;
  errors: FieldErrors<IAccount>;
  userOptions: SelectOption[];
  userDisabled?: boolean;
}

export const AccountFormFields = ({
  register,
  control,
  errors,
  userOptions,
  userDisabled = false,
}: AccountFormFieldsProps) => {
  const translate = useTranslate();

  return (
    <>
      <TextInput
        label={translate("panel.account.field.name", "Name")}
        error={errors.name?.message}
        {...register("name", {
          required: translate("panel.account.nameRequired", "Please input a name!"),
        })}
      />
      <Controller
        control={control}
        name="type"
        rules={{ required: true }}
        render={({ field }) => (
          <SelectInput
            label={translate("panel.account.field.type", "Type")}
            options={ACCOUNT_TYPES.map((value) => ({
              value,
              label: translate(`panel.account.type.${value}`, value),
            }))}
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
      <TextInput
        label={translate("panel.account.field.currency", "Currency")}
        maxLength={3}
        {...register("currency")}
      />
      <Controller
        control={control}
        name="userId"
        rules={userDisabled ? undefined : { required: translate("panel.account.userRequired", "Please select an user!") }}
        render={({ field, fieldState }) => (
          <SelectInput
            label={translate("panel.account.field.user", "User")}
            options={userOptions}
            value={field.value}
            onChange={field.onChange}
            disabled={userDisabled}
            error={fieldState.error?.message}
          />
        )}
      />
    </>
  );
};
