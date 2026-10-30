import { useMemo } from "react";
import { useList, useTranslate } from "@refinedev/core";
import type { SelectProps } from "antd";
import { CategoryBadge } from "../components/common/CategoryBadge";
import type { ICategory, ICategoryGroup } from "../interfaces";

const ALL = { pagination: { pageSize: 500 } };

const useCategoryData = (categoryResource: string, groupResource: string, userId?: number) => {
  const translate = useTranslate();
  const { result: categoryResult, query } = useList<ICategory>({ resource: categoryResource, ...ALL });
  const { result: groupResult } = useList<ICategoryGroup>({ resource: groupResource, ...ALL });

  const categories = useMemo(() => categoryResult?.data ?? [], [categoryResult]);
  const groups = useMemo(() => groupResult?.data ?? [], [groupResult]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c] as const)), [categories]);

  const options = useMemo<SelectProps["options"]>(() => {
    const visible = categories.filter((c) => userId == null || c.userId === userId);
    const toOption = (category: ICategory) => ({
      value: category.id,
      label: <CategoryBadge category={category} />,
    });
    if (groups.length === 0) return visible.map(toOption);

    const byGroup = new Map<number | null, ICategory[]>();
    visible.forEach((c) => byGroup.set(c.groupId ?? null, [...(byGroup.get(c.groupId ?? null) ?? []), c]));
    return [
      ...groups
        .filter((g) => byGroup.has(g.id))
        .map((g) => ({ label: g.name, options: (byGroup.get(g.id) ?? []).map(toOption) })),
      ...(byGroup.get(null)?.length
        ? [
            {
              label: translate("panel.category.ungrouped", "Ungrouped"),
              options: (byGroup.get(null) ?? []).map(toOption),
            },
          ]
        : []),
    ];
  }, [categories, groups, userId, translate]);

  return { categories, groups, categoryById, options, isLoading: query.isLoading };
};

/** All categories and groups (admins get every user's); `userId` narrows the select options. */
export const useCategories = (userId?: number) => useCategoryData("categories", "category-groups", userId);

/** Categories and groups of the logged-in user, served by /api/panel so the panel needs no admin rights. */
export const usePanelCategories = () => useCategoryData("panel/categories", "panel/category-groups");
