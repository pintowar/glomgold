import { useMemo } from "react";
import d2lIntl from "d2l-intl";

export const useLocaleNumberFormat = (locale: string) =>
  useMemo(() => {
    const numFmt = new d2lIntl.NumberFormat(locale, { maximumFractionDigits: 2 });
    const numParser = new d2lIntl.NumberParse(locale);
    return {
      formatter: (value: number | undefined) => {
        const num = parseFloat(`${value}`);
        return Number.isNaN(num) ? "" : numFmt.format(num);
      },
      parser: (value: string | undefined) => (value ? numParser.parse(value) : 0),
    };
  }, [locale]);
