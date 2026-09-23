import { useCallback } from "react";

export const useCurrencyFormat = (locale: string, currency: string) =>
  useCallback((value: number) => value.toLocaleString(locale, { style: "currency", currency }), [locale, currency]);
