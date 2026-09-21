import dataProvider from "@refinedev/simple-rest";
import type { BaseRecord, DataProvider, DeleteManyParams } from "@refinedev/core";
import { axiosInstance } from "../authProvider";
import { API_URL, PANEL_URLS } from "../constants";

const base = dataProvider(API_URL, axiosInstance);

const isPanelItems = (resource: string) => resource === "panel-items";
const isPanelProfile = (resource: string) => resource === "panel-profile";

export const panelDataProvider: DataProvider = {
  ...base,
  create: async ({ resource, variables, meta }) => {
    if (!isPanelItems(resource)) return base.create({ resource, variables, meta });
    const { data } = await axiosInstance.post(PANEL_URLS.addItem, variables);
    return { data };
  },
  update: async ({ resource, id, variables, meta }) => {
    if (isPanelProfile(resource)) {
      const { data } = await axiosInstance.patch("/api/panel/profile", variables);
      return { data };
    }
    if (!isPanelItems(resource)) return base.update({ resource, id, variables, meta });
    const { data } = await axiosInstance.patch(PANEL_URLS.editItem(id as string | number), variables);
    return { data };
  },
  deleteOne: async ({ resource, id, meta }) => {
    if (!isPanelItems(resource)) return base.deleteOne({ resource, id, meta });
    const { data } = await axiosInstance.delete(PANEL_URLS.removeItem(id as string | number));
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
    const { data } = await axiosInstance.delete(PANEL_URLS.removeItems(period, ids.join(",")));
    return { data };
  },
  getOne: async ({ resource, id, meta }) => {
    if (isPanelProfile(resource)) {
      const { data } = await axiosInstance.get("/api/panel/profile");
      return { data };
    }
    return base.getOne({ resource, id, meta });
  },
};
