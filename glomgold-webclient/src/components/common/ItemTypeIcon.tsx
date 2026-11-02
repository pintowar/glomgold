import { DollarSign, ShoppingCart } from "lucide-react";
import type { ItemType } from "../../constants";

export const ItemTypeIcon = ({ type }: { type: ItemType }) =>
  type === "EXPENSE" ? <ShoppingCart className="size-4" /> : <DollarSign className="size-4" />;
