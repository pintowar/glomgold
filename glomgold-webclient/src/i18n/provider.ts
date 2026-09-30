import type { I18nProvider } from "@refinedev/core";
import { translateKey, type SupportedLang } from "./translations";
import { persistLang } from "./locale";

/**
 * Builds a Refine i18nProvider bound to the current language.
 * Recreate (via useMemo on lang) so translate() always reads the active locale.
 */
export const buildI18nProvider = (lang: SupportedLang, setLang: (lang: SupportedLang) => void): I18nProvider => ({
  translate: (key: string, options?: Record<string, unknown>, defaultMessage?: string) =>
    translateKey(lang, key, options, defaultMessage),
  changeLocale: (locale: string) => {
    const next: SupportedLang = locale.toLowerCase().startsWith("pt") ? "pt" : "en";
    setLang(next);
    persistLang(next);
    return Promise.resolve();
  },
  getLocale: () => lang,
});
