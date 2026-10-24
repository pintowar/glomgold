import { useList } from "@refinedev/core";
import { useMemo } from "react";
import type { IAccount } from "../interfaces";

export const usePanelAccounts = () => {
  const { query, result } = useList<IAccount>({ resource: "panel-accounts" });
  const accounts = useMemo(() => result?.data ?? [], [result?.data]);

  return { accounts, isLoading: query.isLoading };
};
