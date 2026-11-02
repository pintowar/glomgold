import { useState } from "react";
import { useCustom, useCustomMutation, useDelete, useInvalidate, useTranslate } from "@refinedev/core";
import { Loader2, Trash } from "lucide-react";

import { CategoryBadge } from "./CategoryBadge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { errorPayload, successPayload } from "../../utils/notify";
import type { ICategory, ICategoryUsage } from "../../interfaces";

interface CategoryDeleteDialogProps {
  record: ICategory;
  candidates: ICategory[];
  /** Category collection used by `useDelete` (e.g. `categories` or `panel/categories`). */
  resource: string;
  /** `/api/.../categories/usage` base; the record id is appended. */
  usageUrl: string;
  invalidates: ("list" | "many")[];
  "data-cy"?: string;
}

/** Delete is usage-aware: referencing items must be transferred to another category first. */
export const CategoryDeleteDialog = ({
  record,
  candidates,
  resource,
  usageUrl,
  invalidates,
  "data-cy": dataCy,
}: CategoryDeleteDialogProps) => {
  const translate = useTranslate();
  const invalidate = useInvalidate();
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<number>();
  const { mutate: removeOne } = useDelete();
  const { mutate: removeWithTransfer } = useCustomMutation();

  const { result: usage, query } = useCustom<ICategoryUsage>({
    url: `${usageUrl}/${record.id}`,
    method: "get",
    queryOptions: { enabled: open, retry: false },
  });
  const itemCount = usage?.data?.itemCount ?? 0;

  const done = () => {
    setOpen(false);
    setTarget(undefined);
    void invalidate({ resource, invalidates });
  };

  const confirm = () => {
    const successNotification = successPayload(translate("panel.category.removed", "Category removed."));
    const errorNotification = errorPayload(translate("panel.category.removeError", "Could not remove category."));
    if (itemCount === 0) {
      removeOne({ resource, id: record.id, successNotification, errorNotification }, { onSuccess: done });
    } else {
      removeWithTransfer(
        {
          url: `${usageUrl.replace(/\/usage$/, "")}/${record.id}?transferTo=${target}`,
          method: "delete",
          values: {},
          successNotification,
          errorNotification,
        },
        { onSuccess: done }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="icon" data-cy={dataCy}>
          <Trash className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{translate("panel.category.remove", "Remove category")}</DialogTitle>
        </DialogHeader>
        {query.isLoading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : itemCount === 0 ? (
          <p className="text-sm">{translate("panel.category.confirmRemove", "Sure to remove?")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm">
              {translate(
                "panel.category.transferPrompt",
                { count: itemCount },
                "{count} items use this category. Move them to:"
              )}
            </p>
            <Select value={target == null ? undefined : `${target}`} onValueChange={(next) => setTarget(Number(next))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={`${candidate.id}`}>
                    <CategoryBadge category={candidate} />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {translate("panel.items.importCancel", "Cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={query.isLoading || (itemCount > 0 && target == null)}
          >
            {translate("buttons.save", "Save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
