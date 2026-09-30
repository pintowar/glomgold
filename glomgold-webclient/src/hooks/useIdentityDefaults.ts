import { useGetIdentity } from "@refinedev/core";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE, DEFAULT_SYMBOL } from "../constants";
import { toBcp47 } from "../i18n/locale";

interface PanelIdentity {
  locale: string;
  currency: string;
  symbol: string;
}

export const useIdentityDefaults = () => {
  const { data: identity } = useGetIdentity<PanelIdentity>();
  return {
    identity,
    locale: toBcp47(identity?.locale, DEFAULT_LOCALE),
    currency: identity?.currency ?? DEFAULT_CURRENCY,
    symbol: identity?.symbol ?? DEFAULT_SYMBOL,
  };
};
