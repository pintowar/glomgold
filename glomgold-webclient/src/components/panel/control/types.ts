import type { ItemOrigin, ItemType } from "../../../constants";

export interface PanelItem {
  key: number;
  description: string;
  itemType: ItemType;
  value: number;
  origin?: ItemOrigin;
}

export interface ItemBody {
  period: string;
  description: string;
  value: number;
  itemType?: ItemType;
}

export interface CsvColumnMapping {
  description?: string;
  value?: string;
  itemType?: string;
  date?: string;
}

export interface ImportPreviewRow {
  raw?: Record<string, string>;
  description?: string | null;
  value?: number | null;
  itemType?: ItemType | null;
  date?: string | null;
  period?: string | null;
  valid: boolean;
  error?: string | null;
}

export interface ImportPreviewResponse {
  headers: string[];
  hasHeader: boolean;
  rows: ImportPreviewRow[];
  periodGroups: Record<string, number>;
  origin: ItemOrigin;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  periods: string[];
}
