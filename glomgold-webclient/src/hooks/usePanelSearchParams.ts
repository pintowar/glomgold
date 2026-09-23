import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

export const usePanelSearchParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Single merge point for URL params: set a value, or pass undefined to drop it.
  const updateSearchParams = useCallback(
    (patch: Record<string, string | undefined>) => {
      setSearchParams((params) => {
        const next = { ...Object.fromEntries(params) };
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined) {
            delete next[key];
          } else {
            next[key] = value;
          }
        }
        return next;
      });
    },
    [setSearchParams]
  );

  return { searchParams, updateSearchParams };
};
