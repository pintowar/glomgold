import { useTranslate } from "@refinedev/core";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { SelectInput, TextInput, type SelectOption } from "../common/form-fields";
import type { ICategoryGroup } from "../../interfaces";

interface CategoryGroupFormFieldsProps {
  register: UseFormRegister<ICategoryGroup>;
  control: Control<ICategoryGroup>;
  errors: FieldErrors<ICategoryGroup>;
  userOptions: SelectOption[];
  userDisabled?: boolean;
}

export const CategoryGroupFormFields = ({
  register,
  control,
  errors,
  userOptions,
  userDisabled = false,
}: CategoryGroupFormFieldsProps) => {
  const translate = useTranslate();

  return (
    <>
      <TextInput
        label={translate("panel.category.field.name", "Name")}
        error={errors.name?.message}
        {...register("name", {
          required: translate("panel.category.nameRequired", "Please input a name!"),
        })}
      />
      <TextInput
        type="color"
        label={translate("panel.category.field.color", "Color")}
        {...register("color")}
      />
      <TextInput
        type="number"
        min={0}
        label={translate("panel.category.field.position", "Position")}
        {...register("position", { valueAsNumber: true })}
      />
      <Controller
        control={control}
        name="userId"
        render={({ field }) => (
          <SelectInput
            label={translate("panel.category.field.user", "User")}
            options={userOptions}
            value={field.value}
            onChange={field.onChange}
            allowClear={!userDisabled}
            disabled={userDisabled}
          />
        )}
      />
    </>
  );
};
