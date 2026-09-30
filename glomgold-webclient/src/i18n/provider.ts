import type { I18nProvider } from "@refinedev/core";
import { translateKey, type SupportedLang } from "./translations";
import { persistLang } from "./locale";

/**
 * Builds a Refine i18nProvider bound to the current language.
 * Recreate (via useMemo on lang) so translate() always reads the active locale.
 */
export const buildI18nProvider = (lang: SupportedLang, setLang: (lang: SupportedLang) => void): I18nProvider => ({
  // Mirrors useTranslate's overloads: (key, options?, defaultMessage?) and (key, defaultMessage?).
  // A string 2nd arg with no 3rd arg is the default message (e.g. translate("buttons.save", "Save")).
  translate: (key: string, options?: unknown, defaultMessage?: string) =>
    translateKey(
      lang,
      key,
      typeof options === "object" && options !== null ? (options as Record<string, unknown>) : undefined,
      typeof options === "string" && typeof defaultMessage === "undefined" ? options : defaultMessage
    ),
  changeLocale: (locale: string) => {
    const next: SupportedLang = locale.toLowerCase().startsWith("pt") ? "pt" : "en";
    setLang(next);
    persistLang(next);
    return Promise.resolve();
  },
  getLocale: () => lang,
});
