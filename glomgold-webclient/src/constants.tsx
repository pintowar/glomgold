export const API_URL = "/api";
export const TOKEN_KEY = "glomgold-jwt-token";
export const USER_KEY = "glomgold-jwt-user";
export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_SYMBOL = "$";
export const EXPENSE_COLOR = "#F5222D";
export const INCOME_COLOR = "#1677FF";
export const BALANCE_COLOR = "#722ED1";
export const UP_COLOR = "#52C41A";
export const DOWN_COLOR = "#FAAD14";
export type ItemType = "EXPENSE" | "INCOME";
export const ITEM_TYPES: ItemType[] = ["EXPENSE", "INCOME"];
export const PERIOD_FORMAT = "YYYY-MM";
export const PANEL_QUERY_KEYS = { control: "control-panel-key", profile: "panel-profile", items: "panel-items" } as const;
export const PANEL_URLS = {
  panel: "/api/panel",
  addItem: "/api/panel/add-item",
  editItem: (key: number | string) => `/api/panel/edit-item/${key}`,
  removeItem: (key: number | string) => `/api/panel/remove-item/${key}`,
  removeItems: (period: string, ids: string) => `/api/panel/remove-items/${period}?ids=${ids}`,
  copyItems: "/api/panel/copy-items",
  itemComplete: "/api/panel/item-complete",
} as const;
export type ReportType = "BALANCE" | "EXPENSE" | "INCOME";
export const REPORT_TYPES: ReportType[] = ["BALANCE", "EXPENSE", "INCOME"];
