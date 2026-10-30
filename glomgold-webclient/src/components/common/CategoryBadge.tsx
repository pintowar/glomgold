import React from "react";
import { Tag } from "antd";
import type { ICategory } from "../../interfaces";

/** Colour tag with the category name. */
export const CategoryBadge: React.FC<{ category?: ICategory | null }> = ({ category }) =>
  category ? <Tag color={category.color}>{category.name}</Tag> : null;
