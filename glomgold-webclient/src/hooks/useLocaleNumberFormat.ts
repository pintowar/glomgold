import { useMemo } from "react";

const decimalSeparator = (locale: string) =>
  new Intl.NumberFormat(locale).formatToParts(1.1).find((part) => part.type === "decimal")?.value ?? ".";

const groupSeparator = (locale: string) =>
  new Intl.NumberFormat(locale).formatToParts(1000).find((part) => part.type === "group")?.value ?? ",";

/** Locale-aware number formatting/parsing (replaces the old `d2l-intl` dependency). */
export const useLocaleNumberFormat = (locale: string) =>
  useMemo(() => {
    const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const decimal = decimalSeparator(locale);
    const group = groupSeparator(locale);
    return {
      formatter: (value: number | undefined) => {
        const num = parseFloat(`${value}`);
        return Number.isNaN(num) ? "" : formatter.format(num);
      },
      parser: (value: string | undefined) => {
        if (!value) return 0;
        const num = parseFloat(value.split(group).join("").replace(decimal, "."));
        return Number.isNaN(num) ? 0 : num;
      },
    };
  }, [locale]);
