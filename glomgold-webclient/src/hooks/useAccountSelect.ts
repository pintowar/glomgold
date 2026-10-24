import { useSelect } from "@refinedev/antd";
import type { CrudFilters } from "@refinedev/core";
import type { IAccount } from "../interfaces";

export const useAccountSelect = (userId?: number | string) => {
  const filters: CrudFilters = [];
  if (userId !== undefined && userId !== null && userId !== "") {
    filters.push({ field: "userId", operator: "eq", value: userId });
  }

  return useSelect<IAccount>({
    resource: "accounts",
    optionLabel: "name",
    optionValue: "id",
    filters,
  });
};
