import React, { useCallback } from "react";
import { type FormInstance } from "antd";
import { useCustomMutation } from "@refinedev/core";
import { PANEL_URLS } from "../../../constants";
import { errorPayload, successPayload } from "../../../utils/notify";
import type { ItemBody, PanelItem } from "./types";

interface MonthItemsMutationsDeps {
  formattedPeriod: string;
  addForm: FormInstance;
  editForm: FormInstance;
  selectedRows: { keys: React.Key[]; rows: PanelItem[] };
  invalidateQuery: (period: string) => Promise<void>;
  setEditingKey: (key: string) => void;
  focusDescription: () => void;
}

export const useMonthItemsMutations = ({
  formattedPeriod,
  addForm,
  editForm,
  selectedRows,
  invalidateQuery,
  setEditingKey,
  focusDescription,
}: MonthItemsMutationsDeps) => {
  const { mutate: onCreateUpdateItem } = useCustomMutation<ItemBody>();
  const { mutate: onMonthItemCopy } = useCustomMutation<ItemBody[]>();
  const { mutate: onDeleteItem } = useCustomMutation();

  // Shared add/edit path: only the form, endpoint, and callbacks differ.
  const saveItem = useCallback(
    async (
      source: FormInstance,
      url: string,
      method: "post" | "patch",
      callbacks: { onSuccess?: () => void; onSettled?: () => void; onValidationError?: () => void } = {}
    ) => {
      let row: PanelItem;
      try {
        row = (await source.validateFields()) as PanelItem;
      } catch (errInfo) {
        console.error("Validate Failed:", errInfo);
        callbacks.onValidationError?.();
        return;
      }
      onCreateUpdateItem(
        {
          url,
          method,
          values: {
            period: formattedPeriod,
            description: row.description,
            value: row.value,
            itemType: row.itemType,
          },
          successNotification: successPayload("Item saved."),
          errorNotification: errorPayload("Could not save item."),
        },
        {
          onSuccess: callbacks.onSuccess,
          onSettled: callbacks.onSettled,
        }
      );
    },
    [onCreateUpdateItem, formattedPeriod]
  );

  const addItem = useCallback(
    () =>
      saveItem(addForm, PANEL_URLS.addItem, "post", {
        onSuccess: () => {
          addForm.resetFields();
          focusDescription();
          void invalidateQuery(formattedPeriod);
        },
      }),
    [saveItem, addForm, focusDescription, invalidateQuery, formattedPeriod]
  );

  const editItem = useCallback(
    (key: number) =>
      saveItem(editForm, PANEL_URLS.editItem(key), "patch", {
        onSuccess: () => {
          void invalidateQuery(formattedPeriod);
        },
        onSettled: () => setEditingKey(""),
        onValidationError: () => setEditingKey(""),
      }),
    [saveItem, editForm, invalidateQuery, formattedPeriod, setEditingKey]
  );

  // Shared delete path: only the endpoint and the post-invalidation follow-up differ.
  const removeItems = useCallback(
    (url: string, afterSuccess?: () => void) => {
      onDeleteItem(
        {
          url,
          method: "delete",
          values: {},
          successNotification: successPayload("Item removed."),
          errorNotification: errorPayload("Could not remove item."),
        },
        {
          onSuccess: () => {
            void invalidateQuery(formattedPeriod).then(() => afterSuccess?.());
          },
        }
      );
    },
    [onDeleteItem, invalidateQuery, formattedPeriod]
  );

  const deleteItem = useCallback(
    (item: PanelItem) => removeItems(PANEL_URLS.removeItem(item.key), () => addForm.resetFields()),
    [removeItems, addForm]
  );

  const copyNextMonth = useCallback(() => {
    onMonthItemCopy({
      url: PANEL_URLS.copyItems,
      method: "post",
      values: selectedRows.rows.map((it) => ({
        period: formattedPeriod,
        description: it.description,
        itemType: it.itemType,
        value: it.value,
      })),
      successNotification: successPayload("Items were successfully replicated to the next month"),
      errorNotification: errorPayload("Could not replicate items."),
    });
  }, [onMonthItemCopy, selectedRows.rows, formattedPeriod]);

  const deleteSelected = useCallback(() => {
    const itemIds = selectedRows.rows.map((r) => r.key).join(",");
    removeItems(PANEL_URLS.removeItems(formattedPeriod, itemIds));
  }, [removeItems, selectedRows.rows, formattedPeriod]);

  return { addItem, editItem, deleteItem, copyNextMonth, deleteSelected };
};
