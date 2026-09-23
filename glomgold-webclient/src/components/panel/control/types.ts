import type { ItemType } from "../../../constants";

export interface PanelItem {
  key: number;
  description: string;
  itemType: ItemType;
  value: number;
}

export interface ItemBody {
  period: string;
  description: string;
  value: number;
}
