import { useSelect } from "@refinedev/core";
import type { CrudFilters } from "@refinedev/core";
import type { IAccount } from "../interfaces";

/** Account options as strings (Radix Select values are strings). */
export const useAccountSelect = (userId?: number | string) => {
  const filters: CrudFilters = [];
  if (userId !== undefined && userId !== null && userId !== "") {
    filters.push({ field: "userId", operator: "eq", value: userId });
  }

  const { options, query } = useSelect<IAccount>({
    resource: "accounts",
    optionLabel: "name",
    optionValue: "id",
    filters,
  });

  return {
    options: options.map((option) => ({ label: option.label, value: String(option.value) })),
    query,
  };
};
