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
import { ApiError, jsonRequest, request } from "./http";

// The bundled simple-rest provider forces `throwHttpErrors: false` and maps error
// bodies as data on GET, so an expired session came back as a "successful" list.
// Fail 401s here so Refine's authProvider.onError can log out and redirect.
const unauthorizedGuard = {
  afterResponse: [
    (_request: Request, _options: RequestInit, response: Response) => {
      if (response.status === 401) throw new ApiError(401, response.statusText);
      return response;
    },
  ],
};

const base: DataProvider = createSimpleRestDataProvider({
  apiURL: `${API_URL}/`,
  kyOptions: { credentials: "include", throwHttpErrors: true, hooks: unauthorizedGuard },
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
  // biome-ignore lint/complexity/noBannedTypes: mirrors @refinedev/core's own `TVariables = {}` signature
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
  // biome-ignore lint/complexity/noBannedTypes: mirrors @refinedev/core's own `TVariables = {}` signature
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
  // biome-ignore lint/complexity/noBannedTypes: mirrors @refinedev/core's own `TVariables = {}` signature
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
  // biome-ignore lint/complexity/noBannedTypes: mirrors @refinedev/core's own `TVariables = {}` signature
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
