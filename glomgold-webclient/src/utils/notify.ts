import { getStoredLang } from "../i18n/locale";
import { translateKey } from "../i18n/translations";

export const successPayload = (description: string) => () => ({
  message: translateKey(getStoredLang(), "common.success", undefined, "Successful Operation"),
  description,
  type: "success" as const,
});

export const errorPayload = (description: string) => () => ({
  message: translateKey(getStoredLang(), "common.error", undefined, "Operation Error"),
  description,
  type: "error" as const,
});
