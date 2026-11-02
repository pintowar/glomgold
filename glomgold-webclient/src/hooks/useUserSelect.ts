import { useSelect } from "@refinedev/core";
import type { IUser } from "../interfaces";

/** User options as strings (Radix Select values are strings). */
export const useUserSelect = (defaultValue?: number | string) => {
  const { options, query } = useSelect<IUser>({
    resource: "users",
    optionLabel: "name",
    optionValue: "id",
    ...(defaultValue !== undefined ? { defaultValue } : {}),
  });

  return {
    options: options.map((option) => ({ label: option.label, value: String(option.value) })),
    query,
  };
};
