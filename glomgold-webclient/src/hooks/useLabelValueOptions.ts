import { useMemo } from "react";
import { useCustom } from "@refinedev/core";

export interface LabelValueOption {
  label: string;
  value: string;
}

export const useLabelValueOptions = (url: string): LabelValueOption[] => {
  const { result } = useCustom<string[]>({ url, method: "get" });
  return useMemo(() => {
    const data = result?.data;
    return (Array.isArray(data) ? data : []).map((it: string) => ({ label: it, value: it }));
  }, [result]);
};
