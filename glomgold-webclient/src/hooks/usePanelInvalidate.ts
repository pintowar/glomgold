import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PANEL_QUERY_KEYS } from "../constants";

type PanelKey = (typeof PANEL_QUERY_KEYS)[keyof typeof PANEL_QUERY_KEYS];

export const usePanelInvalidate = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (key: PanelKey, period?: string) => queryClient.invalidateQueries({ queryKey: period ? [key, period] : [key] }),
    [queryClient]
  );
};
