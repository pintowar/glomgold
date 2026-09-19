export interface IItem {
  id: number;
  version: number;
  description: string;
  value: number;
  itemType: "EXPENSE" | "INCOME";
  currency: string;
  year: number;
  month: number;
  userId: number;
}

export interface IUser {
  id: number;
  version: number;
  username: string;
  email: string;
  name: string;
  locale: string;
  timezone: string;
  enabled: boolean;
  admin: boolean;
}

export interface IPanelAnnualReport {
  columns: string[];
  rowIndex: string[];
  data: number[][];
  rowSummary: number[];
  rowTrend: number[];
  colSummary: number[];
  colAverage: number[];
  total: number;
}

export interface ISummary {
  expense: number;
  income: number;
  balance: number;
}
