import { useCallback } from "react";
import { useCreate, useCustomMutation, useDelete, useDeleteMany, useTranslate, useUpdate } from "@refinedev/core";
import { PANEL_QUERY_KEYS, PANEL_URLS } from "../../../constants";
import { usePanelInvalidate } from "../../../hooks/usePanelInvalidate";
import { errorPayload, successPayload } from "../../../utils/notify";
import type { ItemBody, PanelItem } from "./types";

interface MonthItemsMutationsDeps {
  formattedPeriod: string;
  accountId?: number;
  selectedRows: PanelItem[];
  onAddSuccess?: () => void;
  onEditSettled?: () => void;
}

export const useMonthItemsMutations = ({
  formattedPeriod,
  accountId,
  selectedRows,
  onAddSuccess,
  onEditSettled,
}: MonthItemsMutationsDeps) => {
  const { mutate: createItem } = useCreate<ItemBody>();
  const { mutate: updateItem } = useUpdate<ItemBody>();
  const { mutate: deleteOneItem } = useDelete();
  const { mutate: deleteManyItems } = useDeleteMany();
  const { mutate: onMonthItemCopy } = useCustomMutation<ItemBody[]>();
  const translate = useTranslate();

  const invalidatePanel = usePanelInvalidate();
  const invalidatePeriod = useCallback(
    () => invalidatePanel(PANEL_QUERY_KEYS.control, formattedPeriod),
    [invalidatePanel, formattedPeriod]
  );

  const toBody = useCallback(
    (row: Pick<PanelItem, "description" | "value" | "itemType" | "categoryId">): ItemBody => ({
      period: formattedPeriod,
      description: row.description,
      value: row.value,
      itemType: row.itemType,
      categoryId: row.categoryId ?? null,
    }),
    [formattedPeriod]
  );

  const addItem = useCallback(
    (row: Pick<PanelItem, "description" | "value" | "itemType" | "categoryId">) =>
      createItem(
        {
          resource: "panel-items",
          values: { ...toBody(row), accountId },
          successNotification: successPayload(translate("panel.items.saved", "Item saved.")),
          errorNotification: errorPayload(translate("panel.items.saveError", "Could not save item.")),
        },
        {
          onSuccess: () => {
            void invalidatePeriod();
            onAddSuccess?.();
          },
        }
      ),
    [createItem, toBody, accountId, invalidatePeriod, translate, onAddSuccess]
  );

  const editItem = useCallback(
    (key: number, row: Pick<PanelItem, "description" | "value" | "itemType" | "categoryId">) =>
      updateItem(
        {
          resource: "panel-items",
          id: key,
          values: toBody(row),
          successNotification: successPayload(translate("panel.items.saved", "Item saved.")),
          errorNotification: errorPayload(translate("panel.items.saveError", "Could not save item.")),
        },
        {
          onSuccess: () => void invalidatePeriod(),
          onSettled: () => onEditSettled?.(),
        }
      ),
    [updateItem, toBody, invalidatePeriod, translate, onEditSettled]
  );

  const deleteItem = useCallback(
    (item: PanelItem) =>
      deleteOneItem(
        {
          resource: "panel-items",
          id: item.key,
          successNotification: successPayload(translate("panel.items.removed", "Item removed.")),
          errorNotification: errorPayload(translate("panel.items.removeError", "Could not remove item.")),
        },
        { onSuccess: () => void invalidatePeriod() }
      ),
    [deleteOneItem, invalidatePeriod, translate]
  );

  const copyNextMonth = useCallback(() => {
    onMonthItemCopy({
      url: PANEL_URLS.copyItems,
      method: "post",
      values: selectedRows.map((it) => ({
        period: formattedPeriod,
        description: it.description,
        itemType: it.itemType,
        value: it.value,
        accountId,
        categoryId: it.categoryId ?? null,
      })),
      successNotification: successPayload(
        translate("panel.items.replicated", "Items were successfully replicated to the next month")
      ),
      errorNotification: errorPayload(translate("panel.items.replicateError", "Could not replicate items.")),
    });
  }, [onMonthItemCopy, selectedRows, formattedPeriod, accountId, translate]);

  const deleteSelected = useCallback(() => {
    deleteManyItems(
      {
        resource: "panel-items",
        ids: selectedRows.map((r) => r.key),
        meta: { period: formattedPeriod },
        successNotification: successPayload(translate("panel.items.removed", "Item removed.")),
        errorNotification: errorPayload(translate("panel.items.removeError", "Could not remove item.")),
      },
      { onSuccess: () => void invalidatePeriod() }
    );
  }, [deleteManyItems, selectedRows, formattedPeriod, invalidatePeriod, translate]);

  return { addItem, editItem, deleteItem, copyNextMonth, deleteSelected };
};
