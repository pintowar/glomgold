import type { ICategory } from "../../interfaces";
import { Badge } from "../ui/badge";

/** Colour tag with the category name. */
export const CategoryBadge = ({ category }: { category?: ICategory | null }) =>
  category ? (
    <Badge style={{ backgroundColor: category.color, color: "#fff" }} data-testid="category-badge">
      {category.name}
    </Badge>
  ) : null;
