import type { SupportedLang } from "./translations";

export const LOCALE_STORAGE_KEY = "glomgold-locale";

export const normalizeLang = (tag: string | undefined | null): SupportedLang => {
  const t = (tag ?? "").toLowerCase().replace("_", "-");
  return t.startsWith("pt") ? "pt" : "en";
};

export const toBcp47 = (tag: string | undefined | null, fallback = "en-US"): string => {
  const normalized = (tag ?? "").replace("_", "-");
  if (/^pt\b/i.test(normalized) || normalized.toLowerCase().startsWith("pt-")) return "pt-BR";
  if (/^en\b/i.test(normalized) || normalized.toLowerCase().startsWith("en-")) return "en-US";
  return fallback;
};

export const resolveInitialLang = (): SupportedLang => {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) return normalizeLang(stored);
  } catch {
    // ignore storage errors (private mode, SSR)
  }
  return normalizeLang(window.navigator.language);
};

export const persistLang = (lang: SupportedLang): void => {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, lang === "pt" ? "pt-BR" : "en-US");
  } catch {
    // ignore storage errors
  }
};

/** Non-React lookup (e.g. authProvider outside component tree). */
export const getStoredLang = (): SupportedLang => {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) return normalizeLang(stored);
  } catch {
    // ignore
  }
  return normalizeLang(typeof window !== "undefined" ? window.navigator.language : "en-US");
};
