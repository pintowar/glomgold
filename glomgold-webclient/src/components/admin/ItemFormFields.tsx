import { useTranslate } from "@refinedev/core";
import { Controller, type Control, type FieldErrors, type UseFormRegister, type UseFormSetValue, type UseFormWatch } from "react-hook-form";

import { SelectInput, TextInput } from "../common/form-fields";
import { ITEM_TYPES } from "../../constants";
import { useAccountSelect } from "../../hooks/useAccountSelect";
import { useCategories } from "../../hooks/useCategories";
import { useUserSelect } from "../../hooks/useUserSelect";
import type { IItem } from "../../interfaces";

export type ItemFormValues = Omit<IItem, "accountId" | "categoryId"> & {
  accountId?: number;
  categoryId?: number | null;
};

interface ItemFormFieldsProps {
  register: UseFormRegister<ItemFormValues>;
  control: Control<ItemFormValues>;
  errors: FieldErrors<ItemFormValues>;
  setValue: UseFormSetValue<ItemFormValues>;
  watch: UseFormWatch<ItemFormValues>;
}

export const ItemFormFields = ({ register, control, errors, setValue, watch }: ItemFormFieldsProps) => {
  const translate = useTranslate();
  const userId = watch("userId");
  const { options: userOptions } = useUserSelect(userId);
  const { options: accountOptions } = useAccountSelect(userId);
  const { options: categoryGroups } = useCategories(userId);

  return (
    <>
      <Controller
        control={control}
        name="itemType"
        rules={{ required: true }}
        render={({ field }) => (
          <SelectInput
            label={translate("panel.items.column.type", "Type")}
            options={ITEM_TYPES.map((value) => ({ value, label: value }))}
            value={field.value}
            onChange={field.onChange}
            error={errors.itemType?.message}
          />
        )}
      />
      <TextInput
        label={translate("panel.items.column.description", "Description")}
        error={errors.description?.message}
        {...register("description", { required: true })}
      />
      <TextInput
        type="number"
        step="any"
        label={translate("panel.items.column.value", "Value")}
        error={errors.value?.message}
        {...register("value", { required: true, valueAsNumber: true })}
      />
      <TextInput
        type="number"
        label={translate("items.field.year", "Year")}
        error={errors.year?.message}
        {...register("year", { required: true, valueAsNumber: true })}
      />
      <TextInput
        type="number"
        min={1}
        max={12}
        label={translate("items.field.month", "Month")}
        error={errors.month?.message}
        {...register("month", { required: true, valueAsNumber: true })}
      />
      <Controller
        control={control}
        name="userId"
        rules={{ required: true }}
        render={({ field }) => (
          <SelectInput
            label={translate("panel.account.field.user", "User")}
            options={userOptions}
            value={field.value}
            onChange={(value) => {
              field.onChange(value);
              setValue("accountId", undefined);
              setValue("categoryId", undefined);
            }}
            error={errors.userId?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="accountId"
        rules={{ required: true }}
        render={({ field }) => (
          <SelectInput
            label={translate("panel.account.label", "Account")}
            options={accountOptions}
            value={field.value}
            onChange={field.onChange}
            disabled={!userId}
            error={errors.accountId?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="categoryId"
        render={({ field }) => (
          <SelectInput
            label={translate("panel.items.column.category", "Category")}
            groups={categoryGroups}
            value={field.value}
            onChange={field.onChange}
            allowClear
            disabled={!userId}
          />
        )}
      />
    </>
  );
};
