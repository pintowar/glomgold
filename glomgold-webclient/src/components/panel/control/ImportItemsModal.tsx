import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Checkbox, Col, Input, Modal, Row, Select, Space, Table, Typography } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import Dragger from "antd/es/upload/Dragger";
import { useNotification, useTranslate } from "@refinedev/core";
import { PANEL_QUERY_KEYS, PANEL_URLS } from "../../../constants";
import { axiosInstance } from "../../../authProvider";
import { usePanelInvalidate } from "../../../hooks/usePanelInvalidate";
import { errorPayload, successPayload } from "../../../utils/notify";
import type { CsvColumnMapping, ImportPreviewResponse, ImportResult } from "./types";

interface ImportItemsModalProps {
  open: boolean;
  formattedPeriod: string;
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
  headers.find((h) => names.some((n) => n.toLowerCase() === h.toLowerCase()));

const defaultMapping = (headers: string[]): CsvColumnMapping => ({
  description: findHeader(headers, "description", "descricao", "descrição", "memo", "desc"),
  value: findHeader(headers, "value", "valor", "amount", "trnamt", "vlr"),
  itemType: findHeader(headers, "type", "tipo", "item_type", "itemtype", "trntype"),
  date: findHeader(headers, "date", "data", "dtposted", "posted", "day"),
});

const isEmptyMapping = (m: CsvColumnMapping): boolean => !m.description && !m.value && !m.itemType && !m.date;

export const ImportItemsModal: React.FC<ImportItemsModalProps> = ({ open, formattedPeriod, onClose, onImported }) => {
  const translate = useTranslate();
  const { open: notify } = useNotification();
  const invalidatePanel = usePanelInvalidate();

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

  const isOfx = useMemo(() => {
    if (preview) return preview.origin === "OFX";
    return file?.name.toLowerCase().endsWith(".ofx") ?? false;
  }, [preview, file]);

  const buildFormData = useCallback(() => {
    const fd = new FormData();
    if (file) fd.append("file", file);
    fd.append("separator", separator);
    fd.append("dateFormat", dateFormat);
    fd.append("hasHeader", String(hasHeader));
    if (mapping.description) fd.append("mapDescription", mapping.description);
    if (mapping.value) fd.append("mapValue", mapping.value);
    if (mapping.itemType) fd.append("mapType", mapping.itemType);
    if (mapping.date) fd.append("mapDate", mapping.date);
    return fd;
  }, [file, separator, dateFormat, hasHeader, mapping]);

  // Auto preview (debounced) whenever inputs change. State resets happen in
  // event handlers (file select/remove, close), so the effect only fetches.
  useEffect(() => {
    if (!open || !file) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      void (async () => {
        if (!cancelled) setPreviewLoading(true);
        try {
          const { data } = await axiosInstance.post<ImportPreviewResponse>(PANEL_URLS.importPreview, buildFormData(), {
            headers: { "Content-Type": "multipart/form-data" },
          });
          if (!cancelled) {
            setPreview(data);
            if (isEmptyMapping(mapping) && data.headers.length > 0 && data.origin !== "OFX") {
              const auto = defaultMapping(data.headers);
              if (!isEmptyMapping(auto)) setMapping((prev) => (isEmptyMapping(prev) ? auto : prev));
            }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    open,
    file,
    separator,
    dateFormat,
    hasHeader,
    mapping.description,
    mapping.value,
    mapping.itemType,
    mapping.date,
  ]);

  const mappingOptions = useMemo(() => {
    const headers = preview?.headers ?? [];
    const byName = headers.map((h) => ({ value: h, label: h }));
    const byOrder = headers.map((h, i) => ({ value: `#${i}`, label: `#${i + 1} (${h})` }));
    const seen = new Set<string>();
    return [...byName, ...byOrder].filter((o) => (seen.has(o.value) ? false : (seen.add(o.value), true)));
  }, [preview]);

  const validCount = useMemo(() => preview?.rows.filter((r) => r.valid).length ?? 0, [preview]);
  const periodSummary = useMemo(() => {
    const groups = preview?.periodGroups ?? {};
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, count]) => `${period} (${count})`)
      .join(", ");
  }, [preview]);

  const setMapField = useCallback(
    (field: keyof CsvColumnMapping) => (value: string | undefined) =>
      setMapping((prev) => ({ ...prev, [field]: value || undefined })),
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!file) {
      notify?.({
        ...errorPayload(translate("panel.items.importNoFile", "Select a CSV or OFX file first."))(),
      });
      return;
    }
    if (preview && validCount === 0) {
      notify?.({
        ...errorPayload(translate("panel.items.importNoValidRows", "No valid rows to import."))(),
      });
      return;
    }
    setConfirmLoading(true);
    try {
      const { data } = await axiosInstance.post<ImportResult>(PANEL_URLS.importItems, buildFormData(), {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const touched = data.periods.length > 0 ? data.periods : [formattedPeriod];
      await Promise.all(touched.map((p) => invalidatePanel(PANEL_QUERY_KEYS.control, p)));
      notify?.({
        ...successPayload(
          translate(
            "panel.items.imported",
            {
              imported: data.imported,
              skipped: data.skipped,
            },
            "{imported} items imported, {skipped} skipped."
          )
        )(),
      });
      onImported?.(data.periods);
      handleClose();
    } catch {
      notify?.({
        ...errorPayload(translate("panel.items.importError", "Could not import items."))(),
      });
    } finally {
      setConfirmLoading(false);
    }
  }, [
    file,
    preview,
    validCount,
    buildFormData,
    formattedPeriod,
    invalidatePanel,
    notify,
    translate,
    onImported,
    handleClose,
  ]);

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      onOk={() => void handleConfirm()}
      okText={translate("panel.items.importConfirm", "Import")}
      cancelText={translate("panel.items.importCancel", "Cancel")}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: !file || (preview != null && validCount === 0) }}
      title={translate("panel.items.importTitle", "Import Items")}
      width={900}
      data-testid="import-items-modal"
    >
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Typography.Text type="secondary">
          {translate("panel.items.importHint", "Upload a CSV or OFX file. Dates in the file decide the target month.")}
        </Typography.Text>
        <Dragger
          accept=".csv,.ofx,.txt"
          maxCount={1}
          beforeUpload={(f) => {
            setFile(f as File);
            setPreview(null);
            return false;
          }}
          onRemove={() => {
            setFile(null);
            setPreview(null);
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">CSV / OFX</p>
        </Dragger>
        {!isOfx && (
          <>
            <Row gutter={12}>
              <Col span={8}>
                <Typography.Text>{translate("panel.items.importSeparator", "Separator")}</Typography.Text>
                <Select
                  value={separator}
                  onChange={setSeparator}
                  options={SEPARATOR_OPTIONS}
                  style={{ width: "100%" }}
                  data-testid="import-separator"
                />
              </Col>
              <Col span={8}>
                <Typography.Text>{translate("panel.items.importDateFormat", "Date format")}</Typography.Text>
                <Select
                  value={DATE_FORMAT_PRESETS.includes(dateFormat) ? dateFormat : undefined}
                  onChange={setDateFormat}
                  options={DATE_FORMAT_PRESETS.map((f) => ({ value: f, label: f }))}
                  placeholder="yyyy-MM-dd"
                  style={{ width: "100%" }}
                  data-testid="import-date-format"
                />
                {!DATE_FORMAT_PRESETS.includes(dateFormat) && (
                  <Input
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    placeholder="yyyy-MM-dd"
                    style={{ marginTop: 8 }}
                  />
                )}
              </Col>
              <Col span={8} style={{ display: "flex", alignItems: "flex-end" }}>
                <Checkbox checked={hasHeader} onChange={(e) => setHasHeader(e.target.checked)}>
                  {translate("panel.items.importHasHeader", "First row is header")}
                </Checkbox>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col span={6}>
                <Typography.Text>{translate("panel.items.importMapDescription", "Description column")}</Typography.Text>
                <Select
                  allowClear
                  value={mapping.description}
                  onChange={setMapField("description")}
                  options={mappingOptions}
                  style={{ width: "100%" }}
                  placeholder="#1"
                  data-testid="import-map-description"
                />
              </Col>
              <Col span={6}>
                <Typography.Text>{translate("panel.items.importMapValue", "Value column")}</Typography.Text>
                <Select
                  allowClear
                  value={mapping.value}
                  onChange={setMapField("value")}
                  options={mappingOptions}
                  style={{ width: "100%" }}
                  placeholder="#2"
                  data-testid="import-map-value"
                />
              </Col>
              <Col span={6}>
                <Typography.Text>{translate("panel.items.importMapType", "Type column")}</Typography.Text>
                <Select
                  allowClear
                  value={mapping.itemType}
                  onChange={setMapField("itemType")}
                  options={mappingOptions}
                  style={{ width: "100%" }}
                  placeholder="#3"
                  data-testid="import-map-type"
                />
              </Col>
              <Col span={6}>
                <Typography.Text>{translate("panel.items.importMapDate", "Date column")}</Typography.Text>
                <Select
                  allowClear
                  value={mapping.date}
                  onChange={setMapField("date")}
                  options={mappingOptions}
                  style={{ width: "100%" }}
                  placeholder="#4"
                  data-testid="import-map-date"
                />
              </Col>
            </Row>
          </>
        )}
        {periodSummary && (
          <Alert
            type="info"
            showIcon
            message={`${translate("panel.items.importPreview", "Preview")}: ${validCount} / ${
              preview?.rows.length ?? 0
            } — ${periodSummary}`}
          />
        )}
        <Table
          size="small"
          loading={previewLoading}
          dataSource={(preview?.rows ?? []).slice(0, 100)}
          pagination={{ pageSize: 8 }}
          rowKey={(_, i) => `${i}`}
          columns={[
            {
              title: translate("panel.items.column.description", "Description"),
              dataIndex: "description",
              ellipsis: true,
            },
            { title: translate("panel.items.column.value", "Value"), dataIndex: "value", width: 100 },
            { title: translate("panel.items.column.type", "Type"), dataIndex: "itemType", width: 90 },
            { title: translate("panel.items.importColumn.period", "Period"), dataIndex: "period", width: 90 },
            {
              title: translate("panel.items.importColumn.status", "Status"),
              width: 220,
              ellipsis: true,
              render: (row: { valid: boolean; error?: string | null }) =>
                row.valid ? (
                  <Typography.Text type="success">OK</Typography.Text>
                ) : (
                  <Typography.Text type="danger">
                    {row.error ?? translate("panel.items.importColumn.invalid", "Invalid")}
                  </Typography.Text>
                ),
            },
          ]}
        />
      </Space>
    </Modal>
  );
};
