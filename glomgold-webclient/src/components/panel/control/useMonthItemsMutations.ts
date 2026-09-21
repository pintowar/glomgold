import React, { useCallback } from "react";
import { type FormInstance } from "antd";
import { useCreate, useCustomMutation, useDelete, useDeleteMany, useUpdate } from "@refinedev/core";
import { PANEL_QUERY_KEYS, PANEL_URLS } from "../../../constants";
import { usePanelInvalidate } from "../../../hooks/usePanelInvalidate";
import { errorPayload, successPayload } from "../../../utils/notify";
import type { ItemBody, PanelItem } from "./types";

interface MonthItemsMutationsDeps {
  formattedPeriod: string;
  addForm: FormInstance;
  editForm: FormInstance;
  selectedRows: { keys: React.Key[]; rows: PanelItem[] };
  setEditingKey: (key: string) => void;
  focusDescription: () => void;
}

export const useMonthItemsMutations = ({
  formattedPeriod,
  addForm,
  editForm,
  selectedRows,
  setEditingKey,
  focusDescription,
}: MonthItemsMutationsDeps) => {
  const { mutate: createItem } = useCreate<ItemBody>();
  const { mutate: updateItem } = useUpdate<ItemBody>();
  const { mutate: deleteOneItem } = useDelete();
  const { mutate: deleteManyItems } = useDeleteMany();
  const { mutate: onMonthItemCopy } = useCustomMutation<ItemBody[]>();

  const invalidatePanel = usePanelInvalidate();
  const invalidatePeriod = useCallback(
    () => invalidatePanel(PANEL_QUERY_KEYS.control, formattedPeriod),
    [invalidatePanel, formattedPeriod]
  );

  // Shared add/edit path: only the form, op, and callbacks differ.
  const saveItem = useCallback(
    async (
      source: FormInstance,
      op: "create" | { key: number },
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
      const values = {
        period: formattedPeriod,
        description: row.description,
        value: row.value,
        itemType: row.itemType,
      };
      const options = {
        onSuccess: () => {
          void invalidatePeriod();
          callbacks.onSuccess?.();
        },
        onSettled: callbacks.onSettled,
      };
      const successNotification = successPayload("Item saved.");
      const errorNotification = errorPayload("Could not save item.");
      if (op === "create") {
        createItem(
          {
            resource: "panel-items",
            values,
            successNotification,
            errorNotification,
          },
          options
        );
      } else {
        updateItem(
          {
            resource: "panel-items",
            id: op.key,
            values,
            successNotification,
            errorNotification,
          },
          options
        );
      }
    },
    [createItem, updateItem, formattedPeriod, invalidatePeriod]
  );

  const addItem = useCallback(
    () =>
      saveItem(addForm, "create", {
        onSuccess: () => {
          addForm.resetFields();
          focusDescription();
        },
      }),
    [saveItem, addForm, focusDescription]
  );

  const editItem = useCallback(
    (key: number) =>
      saveItem(editForm, { key }, {
        onSettled: () => setEditingKey(""),
        onValidationError: () => setEditingKey(""),
      }),
    [saveItem, editForm, setEditingKey]
  );

  const deleteItem = useCallback(
    (item: PanelItem) => {
      deleteOneItem(
        {
          resource: "panel-items",
          id: item.key,
          successNotification: successPayload("Item removed."),
          errorNotification: errorPayload("Could not remove item."),
        },
        {
          onSuccess: () => {
            void invalidatePeriod();
            addForm.resetFields();
          },
        }
      );
    },
    [deleteOneItem, invalidatePeriod, addForm]
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
    deleteManyItems(
      {
        resource: "panel-items",
        ids: selectedRows.rows.map((r) => r.key),
        meta: { period: formattedPeriod },
        successNotification: successPayload("Item removed."),
        errorNotification: errorPayload("Could not remove item."),
      },
      {
        onSuccess: () => void invalidatePeriod(),
      }
    );
  }, [deleteManyItems, selectedRows.rows, formattedPeriod, invalidatePeriod]);

  return { addItem, editItem, deleteItem, copyNextMonth, deleteSelected };
};
