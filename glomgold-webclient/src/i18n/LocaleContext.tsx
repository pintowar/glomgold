import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/pt-br";
import enUS from "antd/locale/en_US";
import ptBR from "antd/locale/pt_BR";
import type { SupportedLang } from "./translations";
import { persistLang, resolveInitialLang, toBcp47 } from "./locale";

interface LocaleContextValue {
  lang: SupportedLang;
  setLang: (lang: SupportedLang) => void;
  /** BCP47 tag for Intl formatters (pt-BR / en-US). */
  bcp47: string;
  antdLocale: typeof enUS;
}

const LocaleContext = createContext<LocaleContextValue>({
  lang: "en",
  setLang: () => undefined,
  bcp47: "en-US",
  antdLocale: enUS,
});

export const LocaleProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [lang, setLangState] = useState<SupportedLang>(() => resolveInitialLang());

  const setLang = useCallback((next: SupportedLang) => {
    setLangState((prev) => {
      if (prev !== next) persistLang(next);
      return next;
    });
  }, []);

  useEffect(() => {
    dayjs.locale(lang === "pt" ? "pt-br" : "en");
  }, [lang]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      lang,
      setLang,
      bcp47: toBcp47(lang === "pt" ? "pt-BR" : "en-US"),
      antdLocale: lang === "pt" ? ptBR : enUS,
    }),
    [lang, setLang]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
};

export const useLocale = (): LocaleContextValue => useContext(LocaleContext);
