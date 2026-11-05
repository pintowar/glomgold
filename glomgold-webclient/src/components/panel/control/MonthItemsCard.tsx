import { useEffect, useMemo, useState } from "react";
import { useCustom, useTranslate } from "@refinedev/core";
import { Check, ChevronsUpDown, Pencil, Plus, Trash, Upload, X } from "lucide-react";

import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Checkbox } from "../../ui/checkbox";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { CategoryBadge } from "../../common/CategoryBadge";
import { ConfirmDeleteButton } from "../../common/ConfirmDeleteButton";
import { ItemTypeIcon } from "../../common/ItemTypeIcon";
import { SelectInput } from "../../common/form-fields";
import { ITEM_TYPES, PANEL_URLS, type ItemType } from "../../../constants";
import { useCurrencyFormat } from "../../../hooks/useCurrencyFormat";
import { usePanelCategories } from "../../../hooks/useCategories";
import { ImportItemsModal } from "./ImportItemsModal";
import type { PanelItem } from "./types";
import { useMonthItemsMutations } from "./useMonthItemsMutations";

interface Draft {
  itemType: ItemType;
  description: string;
  value: string;
  categoryId?: number | null;
}

const EMPTY_DRAFT: Draft = { itemType: "EXPENSE", description: "", value: "", categoryId: null };

type SortKey = "description" | "itemType" | "value";

const parseValue = (value: string) => {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
};

interface MonthItemsCardProps {
  formattedPeriod: string;
  accountId?: number;
  tableData: PanelItem[];
  locale: string;
  currency: string;
  initialSearch: string;
  onSearchChange?: (value: string) => void;
}

export const MonthItemsCard = ({
  formattedPeriod,
  accountId,
  tableData,
  locale,
  currency,
  initialSearch,
  onSearchChange,
}: MonthItemsCardProps) => {
  const translate = useTranslate();
  const currencyFormat = useCurrencyFormat(locale, currency);
  const { categoryById, options: categoryOptions } = usePanelCategories();

  const [addDraft, setAddDraft] = useState<Draft>(EMPTY_DRAFT);
  const [addError, setAddError] = useState<string>();
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [editingKey, setEditingKey] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT);
  const [selectedKeys, setSelectedKeys] = useState<number[]>([]);
  const [valueFilter, setValueFilter] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "description", dir: 1 });
  const [importOpen, setImportOpen] = useState(false);

  // Selection is intentionally cleared whenever the period/account data changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when the data changes
  useEffect(() => setSelectedKeys([]), [tableData]);

  const { result: itemSearchData } = useCustom<string[]>({
    url: PANEL_URLS.itemComplete,
    method: "get",
    config: { query: { description: autocompleteQuery } },
    queryOptions: { enabled: autocompleteQuery.length >= 3 },
  });
  const autocompleteOptions = useMemo(
    () => (Array.isArray(itemSearchData?.data) ? itemSearchData.data : []),
    [itemSearchData]
  );

  const { addItem, editItem, deleteItem, copyNextMonth, deleteSelected } = useMonthItemsMutations({
    formattedPeriod,
    accountId,
    selectedRows: tableData.filter((item) => selectedKeys.includes(item.key)),
    onAddSuccess: () => {
      setAddDraft((prev) => ({ ...EMPTY_DRAFT, itemType: prev.itemType }));
      setAutocompleteQuery("");
      setAddError(undefined);
    },
    onEditSettled: () => setEditingKey(null),
  });

  const rows = useMemo(() => {
    const desc = initialSearch.trim().toLowerCase();
    const value = valueFilter.trim();
    return tableData
      .filter((item) => item.description.toLowerCase().includes(desc) && (value === "" || `${item.value}`.includes(value)))
      .sort((a, b) => {
        const left = a[sort.key];
        const right = b[sort.key];
        if (typeof left === "number" && typeof right === "number") return (left - right) * sort.dir;
        return `${left}`.localeCompare(`${right}`) * sort.dir;
      });
  }, [tableData, initialSearch, valueFilter, sort]);

  const toggleSort = (key: SortKey) =>
    setSort((prev) => ({ key, dir: prev.key === key && prev.dir === 1 ? -1 : 1 }));

  const allSelected = rows.length > 0 && rows.every((row) => selectedKeys.includes(row.key));

  const validate = (draft: Draft) =>
    draft.description.trim() === ""
      ? translate("panel.items.inputRequired", { title: translate("panel.items.column.description", "Description") }, "Description is required.")
      : parseValue(draft.value) <= 0
        ? translate("panel.items.valuePositive", "Value must be greater than zero!")
        : undefined;

  const submitAdd = () => {
    const error = validate(addDraft);
    setAddError(error);
    if (error) return;
    addItem({
      description: addDraft.description.trim(),
      value: parseValue(addDraft.value),
      itemType: addDraft.itemType,
      categoryId: addDraft.categoryId,
    });
  };

  const submitEdit = (key: number) => {
    const error = validate(editDraft);
    if (error) return;
    editItem(key, {
      description: editDraft.description.trim(),
      value: parseValue(editDraft.value),
      itemType: editDraft.itemType,
      categoryId: editDraft.categoryId,
    });
  };

  const startEdit = (item: PanelItem) => {
    setEditingKey(item.key);
    setEditDraft({
      itemType: item.itemType,
      description: item.description,
      value: `${item.value}`,
      categoryId: item.categoryId ?? null,
    });
  };

  const draftFields = (draft: Draft, onChange: (next: Draft) => void, testId: string) => (
    <>
      <div className="w-[110px]">
        <Select value={draft.itemType} onValueChange={(next) => onChange({ ...draft, itemType: next as ItemType })}>
          <SelectTrigger className="w-full" data-testid={`${testId}-type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ITEM_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="min-w-[140px] flex-1">
        <Input
          value={draft.description}
          list="panel-item-descriptions"
          placeholder={translate("panel.items.descriptionPlaceholder", "Description")}
          data-testid={`${testId}-description`}
          onChange={(event) => {
            onChange({ ...draft, description: event.target.value });
            setAutocompleteQuery(event.target.value);
          }}
        />
      </div>
      <div className="w-[140px]">
        <Input
          type="number"
          step="any"
          min={0}
          value={draft.value}
          placeholder={translate("panel.items.valuePlaceholder", "Value")}
          data-testid={`${testId}-value`}
          onChange={(event) => onChange({ ...draft, value: event.target.value })}
        />
      </div>
      <div className="w-[180px]">
        <SelectInput
          groups={categoryOptions}
          value={draft.categoryId ?? undefined}
          onChange={(value) => onChange({ ...draft, categoryId: value == null ? null : Number(value) })}
          allowClear
        />
      </div>
    </>
  );

  // min-w-0 lets the grid item shrink; otherwise the add-row's min-content width
  // pushes the card over its neighbour at lg (1280px).
  return (
    <Card className="h-full w-full min-w-0" data-testid="month-items-card">
      <CardHeader>
        <CardTitle className="text-base">{translate("panel.items.title", "Month Items")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {draftFields(addDraft, setAddDraft, "add-item")}
          <Button data-testid="add-item" disabled={!accountId} onClick={submitAdd}>
            <Plus className="size-4" />
            {translate("panel.items.add", "Add Item")}
          </Button>
        </div>
        <datalist id="panel-item-descriptions">
          {autocompleteOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        {addError && <p className="text-xs text-destructive">{addError}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button data-testid="import-items" variant="outline" disabled={!accountId} onClick={() => setImportOpen(true)}>
            <Upload className="size-4" />
            {translate("panel.items.import", "Import")}
          </Button>
          <Button
            data-testid="replicate-month"
            disabled={selectedKeys.length === 0}
            onClick={() => copyNextMonth()}
          >
            {translate("panel.items.replicate", "Replicate Next Month")}
          </Button>
          <ConfirmDeleteButton
            title={translate("panel.items.confirmDeleteSelected", "Sure to delete all selected?")}
            onConfirm={() => deleteSelected()}
          >
            <Button data-testid="delete-selected" variant="destructive" disabled={selectedKeys.length === 0}>
              {translate("panel.items.deleteSelected", "Delete Selected")}
            </Button>
          </ConfirmDeleteButton>
          <Input
            className="ml-auto w-[160px]"
            placeholder={translate("panel.items.filter.searchPlaceholder", { dataIndex: "description" }, "Search description")}
            value={initialSearch}
            onChange={(event) => onSearchChange?.(event.target.value)}
          />
          <Input
            className="w-[120px]"
            placeholder={translate("panel.items.column.value", "Value")}
            value={valueFilter}
            onChange={(event) => setValueFilter(event.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => setSelectedKeys(checked === true ? rows.map((row) => row.key) : [])}
                />
              </TableHead>
              <TableHead>
                <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("description")}>
                  {translate("panel.items.column.description", "Description")}
                  <ChevronsUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>{translate("panel.items.column.category", "Category")}</TableHead>
              <TableHead>
                <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("itemType")}>
                  {translate("panel.items.column.type", "Type")}
                  <ChevronsUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>
                <button type="button" className="flex items-center gap-1" onClick={() => toggleSort("value")}>
                  {translate("panel.items.column.value", "Value")}
                  <ChevronsUpDown className="size-3" />
                </button>
              </TableHead>
              <TableHead>{translate("panel.items.column.action", "Action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => {
              const editing = editingKey === item.key;
              return (
                <TableRow
                  key={item.key}
                  data-item-key={item.key}
                  data-state={selectedKeys.includes(item.key) ? "selected" : undefined}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedKeys.includes(item.key)}
                      onCheckedChange={(checked) =>
                        setSelectedKeys((prev) =>
                          checked === true ? [...prev, item.key] : prev.filter((key) => key !== item.key)
                        )
                      }
                    />
                  </TableCell>
                  {editing ? (
                    <>
                      <TableCell className="min-w-[180px]">
                        <Input
                          value={editDraft.description}
                          onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })}
                        />
                      </TableCell>
                      <TableCell className="min-w-[150px]">
                        <SelectInput
                          groups={categoryOptions}
                          value={editDraft.categoryId ?? undefined}
                          onChange={(value) =>
                            setEditDraft({ ...editDraft, categoryId: value == null ? null : Number(value) })
                          }
                          allowClear
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={editDraft.itemType}
                          onValueChange={(next) => setEditDraft({ ...editDraft, itemType: next as ItemType })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ITEM_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="any"
                          min={0}
                          value={editDraft.value}
                          onChange={(event) => setEditDraft({ ...editDraft, value: event.target.value })}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            data-testid="item-confirm"
                            variant="ghost"
                            size="icon"
                            onClick={() => submitEdit(item.key)}
                          >
                            <Check className="size-4" />
                          </Button>
                          <Button
                            data-testid="item-cancel"
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingKey(null)}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <CategoryBadge category={item.categoryId != null ? categoryById.get(item.categoryId) : null} />
                      </TableCell>
                      <TableCell>
                        <span title={item.itemType}>
                          <ItemTypeIcon type={item.itemType} />
                        </span>
                      </TableCell>
                      <TableCell>{currencyFormat(item.value)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            data-testid="item-edit"
                            variant="ghost"
                            size="icon"
                            disabled={editingKey !== null}
                            onClick={() => startEdit(item)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <ConfirmDeleteButton
                            title={translate("panel.items.confirmDelete", "Sure to delete?")}
                            onConfirm={() => deleteItem(item)}
                          >
                            <Button data-testid="item-delete" variant="ghost" size="icon">
                              <Trash className="size-4" />
                            </Button>
                          </ConfirmDeleteButton>
                        </div>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <ImportItemsModal
          open={importOpen}
          formattedPeriod={formattedPeriod}
          accountId={accountId}
          onClose={() => setImportOpen(false)}
        />
      </CardContent>
    </Card>
  );
};
