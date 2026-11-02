import type {
  BaseRecord,
  CreateParams,
  DataProvider,
  DeleteManyParams,
  DeleteOneParams,
  GetListParams,
  GetManyParams,
  GetOneParams,
  UpdateParams,
} from "@refinedev/core";
import { createSimpleRestDataProvider } from "@refinedev/rest/simple-rest";

import { API_URL, PANEL_URLS } from "../constants";
import { jsonRequest, request } from "./http";

const base: DataProvider = createSimpleRestDataProvider({
  apiURL: `${API_URL}/`,
  kyOptions: { credentials: "include", throwHttpErrors: true },
}).dataProvider;

const isPanelItems = (resource: string) => resource === "panel-items";
const isPanelProfile = (resource: string) => resource === "panel-profile";
const isPanelAccounts = (resource: string) => resource === "panel-accounts";

const idsQuery = (ids: BaseRecord["id"][]) =>
  ids.map((id) => `id=${encodeURIComponent(String(id))}`).join("&");

export const panelDataProvider: DataProvider = {
  ...base,
  // The bundled simple-rest provider sends `ids[]=…`; the server filters on `id`.
  getMany: async <TData extends BaseRecord = BaseRecord>({ resource, ids }: GetManyParams) => {
    const data = await request<TData[]>(`${API_URL}/${resource}?${idsQuery(ids)}`);
    return { data };
  },
  getList: async <TData extends BaseRecord = BaseRecord>({
    resource,
    pagination,
    sorters,
    filters,
    meta,
  }: GetListParams) => {
    if (!isPanelAccounts(resource)) return base.getList<TData>({ resource, pagination, sorters, filters, meta });
    const data = await request<TData[]>(PANEL_URLS.accounts);
    return { data, total: data.length };
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- mirrors @refinedev/core's own `TVariables = {}` signature
  create: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({
    resource,
    variables,
    meta,
  }: CreateParams<TVariables>) => {
    if (isPanelAccounts(resource)) {
      const data = await request<TData>(PANEL_URLS.accounts, jsonRequest("POST", variables));
      return { data };
    }
    if (!isPanelItems(resource)) return base.create<TData, TVariables>({ resource, variables, meta });
    const data = await request<TData>(PANEL_URLS.addItem, jsonRequest("POST", variables));
    return { data };
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- mirrors @refinedev/core's own `TVariables = {}` signature
  update: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({
    resource,
    id,
    variables,
    meta,
  }: UpdateParams<TVariables>) => {
    if (isPanelProfile(resource)) {
      const data = await request<TData>(PANEL_URLS.profile, jsonRequest("PATCH", variables));
      return { data };
    }
    if (isPanelAccounts(resource)) {
      const data = await request<TData>(PANEL_URLS.account(id), jsonRequest("PATCH", variables));
      return { data };
    }
    if (!isPanelItems(resource)) return base.update<TData, TVariables>({ resource, id, variables, meta });
    const data = await request<TData>(PANEL_URLS.editItem(id), jsonRequest("PATCH", variables));
    return { data };
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- mirrors @refinedev/core's own `TVariables = {}` signature
  deleteOne: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({
    resource,
    id,
    meta,
  }: DeleteOneParams<TVariables>) => {
    if (isPanelAccounts(resource)) {
      const data = await request<TData>(PANEL_URLS.account(id), { method: "DELETE" });
      return { data };
    }
    if (!isPanelItems(resource)) return base.deleteOne<TData, TVariables>({ resource, id, meta });
    const data = await request<TData>(PANEL_URLS.removeItem(id), { method: "DELETE" });
    return { data };
  },
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- mirrors @refinedev/core's own `TVariables = {}` signature
  deleteMany: async <TData extends BaseRecord = BaseRecord, TVariables = {}>({
    resource,
    ids,
    meta,
  }: DeleteManyParams<TVariables>) => {
    if (!isPanelItems(resource)) {
      // simple-rest provides no deleteMany: fan out over deleteOne.
      await Promise.all(ids.map((id) => base.deleteOne({ resource, id, meta })));
      return { data: ids as unknown as TData[] };
    }
    const period = (meta as { period?: string } | undefined)?.period ?? "";
    const data = await request<TData[]>(PANEL_URLS.removeItems(period, ids.join(",")), { method: "DELETE" });
    return { data };
  },
  getOne: async <TData extends BaseRecord = BaseRecord>({ resource, id, meta }: GetOneParams) => {
    if (isPanelProfile(resource)) {
      const data = await request<TData>(PANEL_URLS.profile);
      return { data };
    }
    if (isPanelAccounts(resource)) {
      const data = await request<TData>(PANEL_URLS.account(id));
      return { data };
    }
    return base.getOne<TData>({ resource, id, meta });
  },
};
