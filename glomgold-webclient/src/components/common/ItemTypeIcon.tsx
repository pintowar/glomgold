import React from "react";
import { DollarOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import type { ItemType } from "../../constants";

export const ItemTypeIcon: React.FC<{ type: ItemType }> = ({ type }) =>
  type === "EXPENSE" ? <ShoppingCartOutlined /> : <DollarOutlined />;
