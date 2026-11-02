import { useTranslate } from "@refinedev/core";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";

import { SelectInput, TextInput, type SelectOption } from "../common/form-fields";
import type { ICategory, ICategoryGroup } from "../../interfaces";

interface CategoryFormFieldsProps {
  register: UseFormRegister<ICategory>;
  control: Control<ICategory>;
  errors: FieldErrors<ICategory>;
  groups: ICategoryGroup[];
  userId?: number | null;
  userOptions: SelectOption[];
  userDisabled?: boolean;
}

export const CategoryFormFields = ({
  register,
  control,
  errors,
  groups,
  userId,
  userOptions,
  userDisabled = false,
}: CategoryFormFieldsProps) => {
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
      <Controller
        control={control}
        name="groupId"
        render={({ field }) => (
          <SelectInput
            label={translate("panel.category.field.group", "Group")}
            options={groups
              .filter((group) => userId == null || group.userId === userId)
              .map((group) => ({ value: `${group.id}`, label: group.name }))}
            value={field.value}
            onChange={field.onChange}
            allowClear
          />
        )}
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
