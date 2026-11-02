import { DeleteButton } from "../refine-ui/buttons/delete";
import { EditButton } from "../refine-ui/buttons/edit";

export const ResourceActions = ({ recordId }: { recordId: number | string }) => (
  <div className="flex items-center gap-2">
    <EditButton variant="outline" size="icon" recordItemId={recordId} />
    <DeleteButton variant="destructive" size="icon" recordItemId={recordId} />
  </div>
);
