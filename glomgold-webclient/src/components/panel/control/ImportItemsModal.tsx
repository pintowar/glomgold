import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNotification, useTranslate } from "@refinedev/core";
import { Loader2, Upload } from "lucide-react";

import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table";
import { PANEL_QUERY_KEYS, PANEL_URLS } from "../../../constants";
import { usePanelInvalidate } from "../../../hooks/usePanelInvalidate";
import { request } from "../../../providers/http";
import { errorPayload, successPayload } from "../../../utils/notify";
import type { CsvColumnMapping, ImportPreviewResponse, ImportResult } from "./types";

interface ImportItemsModalProps {
  open: boolean;
  formattedPeriod: string;
  accountId?: number;
  onClose: () => void;
  onImported?: (periods: string[]) => void;
}

const DATE_FORMAT_PRESETS = ["yyyy-MM-dd", "dd/MM/yyyy", "MM/dd/yyyy", "yyyyMMdd"];
const SEPARATOR_OPTIONS = [
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab" },
  { value: "|", label: "Pipe (|)" },
];

const findHeader = (headers: string[], ...names: string[]): string | undefined =>
  headers.find((header) => names.some((name) => name.toLowerCase() === header.toLowerCase()));

const defaultMapping = (headers: string[]): CsvColumnMapping => ({
  description: findHeader(headers, "description", "descricao", "descrição", "memo", "desc"),
  value: findHeader(headers, "value", "valor", "amount", "trnamt", "vlr"),
  itemType: findHeader(headers, "type", "tipo", "item_type", "itemtype", "trntype"),
  date: findHeader(headers, "date", "data", "dtposted", "posted", "day"),
});

const isEmptyMapping = (mapping: CsvColumnMapping): boolean =>
  !mapping.description && !mapping.value && !mapping.itemType && !mapping.date;

export const ImportItemsModal = ({ open, formattedPeriod, accountId, onClose, onImported }: ImportItemsModalProps) => {
  const translate = useTranslate();
  const { open: notify } = useNotification();
  const invalidatePanel = usePanelInvalidate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [separator, setSeparator] = useState(",");
  const [dateFormat, setDateFormat] = useState("yyyy-MM-dd");
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const reset = useCallback(() => {
    setFile(null);
    setSeparator(",");
    setDateFormat("yyyy-MM-dd");
    setHasHeader(true);
    setMapping({});
    setPreview(null);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const isOfx = preview ? preview.origin === "OFX" : (file?.name.toLowerCase().endsWith(".ofx") ?? false);

  const buildFormData = useCallback(() => {
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (accountId !== undefined) formData.append("accountId", `${accountId}`);
    formData.append("separator", separator);
    formData.append("dateFormat", dateFormat);
    formData.append("hasHeader", String(hasHeader));
    if (mapping.description) formData.append("mapDescription", mapping.description);
    if (mapping.value) formData.append("mapValue", mapping.value);
    if (mapping.itemType) formData.append("mapType", mapping.itemType);
    if (mapping.date) formData.append("mapDate", mapping.date);
    return formData;
  }, [file, accountId, separator, dateFormat, hasHeader, mapping]);

  // `buildFormData` already captures the mapping fields; Biome cannot see through it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: buildFormData captures the mapping fields
  useEffect(() => {
    if (!open || !file) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (!cancelled) setPreviewLoading(true);
        try {
          const data = await request<ImportPreviewResponse>(PANEL_URLS.importPreview, {
            method: "POST",
            body: buildFormData(),
          });
          if (cancelled) return;
          setPreview(data);
          if (isEmptyMapping(mapping) && data.headers.length > 0 && data.origin !== "OFX") {
            const auto = defaultMapping(data.headers);
            if (!isEmptyMapping(auto)) setMapping((prev) => (isEmptyMapping(prev) ? auto : prev));
          }
        } catch {
          if (!cancelled) setPreview(null);
        } finally {
          if (!cancelled) setPreviewLoading(false);
        }
      })();
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, file, separator, dateFormat, hasHeader, mapping.description, mapping.value, mapping.itemType, mapping.date]);

  const mappingOptions = useMemo(() => {
    const headers = preview?.headers ?? [];
    return [
      ...headers.map((header) => ({ value: header, label: header })),
      ...headers.map((header, index) => ({ value: `#${index}`, label: `#${index + 1} (${header})` })),
    ];
  }, [preview]);

  const validCount = useMemo(() => preview?.rows.filter((row) => row.valid).length ?? 0, [preview]);
  const periodSummary = useMemo(
    () =>
      Object.entries(preview?.periodGroups ?? {})
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([period, count]) => `${period} (${count})`)
        .join(", "),
    [preview]
  );

  const setMapField = (field: keyof CsvColumnMapping) => (value: string | undefined) =>
    setMapping((prev) => ({ ...prev, [field]: value || undefined }));

  const handleConfirm = useCallback(async () => {
    if (!file) {
      notify?.({ ...errorPayload(translate("panel.items.importNoFile", "Select a CSV or OFX file first."))() });
      return;
    }
    if (preview && validCount === 0) {
      notify?.({ ...errorPayload(translate("panel.items.importNoValidRows", "No valid rows to import."))() });
      return;
    }
    setConfirmLoading(true);
    try {
      const data = await request<ImportResult>(PANEL_URLS.importItems, { method: "POST", body: buildFormData() });
      const touched = data.periods.length > 0 ? data.periods : [formattedPeriod];
      await Promise.all(touched.map((period) => invalidatePanel(PANEL_QUERY_KEYS.control, period)));
      notify?.({
        ...successPayload(
          translate(
            "panel.items.imported",
            { imported: data.imported, skipped: data.skipped },
            "{imported} items imported, {skipped} skipped."
          )
        )(),
      });
      onImported?.(data.periods);
      handleClose();
    } catch {
      notify?.({ ...errorPayload(translate("panel.items.importError", "Could not import items."))() });
    } finally {
      setConfirmLoading(false);
    }
  }, [file, preview, validCount, buildFormData, formattedPeriod, invalidatePanel, notify, translate, onImported, handleClose]);

  const mappingFields: { field: keyof CsvColumnMapping; label: string; testId: string }[] = [
    { field: "description", label: translate("panel.items.importMapDescription", "Description column"), testId: "import-map-description" },
    { field: "value", label: translate("panel.items.importMapValue", "Value column"), testId: "import-map-value" },
    { field: "itemType", label: translate("panel.items.importMapType", "Type column"), testId: "import-map-type" },
    { field: "date", label: translate("panel.items.importMapDate", "Date column"), testId: "import-map-date" },
  ];

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? undefined : handleClose())}>
      <DialogContent className="max-w-4xl" data-testid="import-items-modal">
        <DialogHeader>
          <DialogTitle>{translate("panel.items.importTitle", "Import Items")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {translate("panel.items.importHint", "Upload a CSV or OFX file. Dates in the file decide the target month.")}
          </p>

          <input
            ref={fileInput}
            type="file"
            accept=".csv,.ofx,.txt"
            className="hidden"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null);
              setPreview(null);
            }}
          />
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => fileInput.current?.click()}>
              <Upload className="size-4" />
              CSV / OFX
            </Button>
            <span className="text-sm text-muted-foreground">{file?.name}</span>
            {file && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                  if (fileInput.current) fileInput.current.value = "";
                }}
              >
                {translate("panel.items.importCancel", "Cancel")}
              </Button>
            )}
          </div>

          {!isOfx && (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <Label>{translate("panel.items.importSeparator", "Separator")}</Label>
                  <Select value={separator} onValueChange={setSeparator}>
                    <SelectTrigger data-testid="import-separator">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SEPARATOR_OPTIONS.map((option) => (
                        <SelectItem key={option.label} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1">
                  <Label>{translate("panel.items.importDateFormat", "Date format")}</Label>
                  <Select value={dateFormat} onValueChange={setDateFormat}>
                    <SelectTrigger data-testid="import-date-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FORMAT_PRESETS.map((format) => (
                        <SelectItem key={format} value={format}>
                          {format}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={dateFormat} onChange={(event) => setDateFormat(event.target.value)} placeholder="yyyy-MM-dd" />
                </div>
                <div className="flex items-end">
                  <label htmlFor="import-has-header" className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id="import-has-header"
                      checked={hasHeader}
                      onCheckedChange={(checked) => setHasHeader(checked === true)}
                    />
                    {translate("panel.items.importHasHeader", "First row is header")}
                  </label>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                {mappingFields.map(({ field, label, testId }) => (
                  <div key={field} className="flex flex-col gap-1">
                    <Label>{label}</Label>
                    <Select value={mapping[field] ?? ""} onValueChange={setMapField(field)}>
                      <SelectTrigger data-testid={testId}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mappingOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </>
          )}

          {periodSummary && (
            <p className="rounded-md bg-muted px-3 py-2 text-sm">
              {translate("panel.items.importPreview", "Preview")}: {validCount} / {preview?.rows.length ?? 0} — {periodSummary}
            </p>
          )}

          {previewLoading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("panel.items.column.description", "Description")}</TableHead>
                  <TableHead className="w-24">{translate("panel.items.column.value", "Value")}</TableHead>
                  <TableHead className="w-24">{translate("panel.items.column.type", "Type")}</TableHead>
                  <TableHead className="w-24">{translate("panel.items.importColumn.period", "Period")}</TableHead>
                  <TableHead className="w-56">{translate("panel.items.importColumn.status", "Status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(preview?.rows ?? []).slice(0, 20).map((row, index) => (
                  <TableRow key={`${index}`}>
                    <TableCell>{row.description}</TableCell>
                    <TableCell>{row.value}</TableCell>
                    <TableCell>{row.itemType}</TableCell>
                    <TableCell>{row.period}</TableCell>
                    <TableCell className={row.valid ? "text-green-600" : "text-destructive"}>
                      {row.valid ? "OK" : (row.error ?? translate("panel.items.importColumn.invalid", "Invalid"))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {translate("panel.items.importCancel", "Cancel")}
          </Button>
          <Button
            onClick={() => void handleConfirm()}
            disabled={!file || confirmLoading || (preview != null && validCount === 0)}
          >
            {confirmLoading && <Loader2 className="size-4 animate-spin" />}
            {translate("panel.items.importConfirm", "Import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
