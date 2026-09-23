import { useSelect } from "@refinedev/antd";
import type { IUser } from "../interfaces";

export const useUserSelect = (defaultValue?: number | string) =>
  useSelect<IUser>({
    resource: "users",
    optionLabel: "name",
    optionValue: "id",
    ...(defaultValue !== undefined ? { defaultValue } : {}),
  });
