import { useTranslate } from "@refinedev/core";

import { DeleteButton } from "../refine-ui/buttons/delete";
import { EditButton } from "../refine-ui/buttons/edit";

export const ResourceActions = ({ recordId }: { recordId: number | string }) => {
  const translate = useTranslate();

  return (
    <div className="flex items-center gap-2">
      <EditButton
        aria-label={translate("buttons.edit", "Edit")}
        variant="outline"
        size="icon"
        recordItemId={recordId}
      />
      <DeleteButton
        aria-label={translate("buttons.delete", "Delete")}
        variant="destructive"
        size="icon"
        recordItemId={recordId}
      />
    </div>
  );
};
