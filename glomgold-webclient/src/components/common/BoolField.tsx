import { CheckCircle2, XCircle } from "lucide-react";

export const BoolField = ({ value }: { value: boolean }) =>
  value ? (
    <CheckCircle2 className="size-4 text-green-600" aria-label="Yes" />
  ) : (
    <XCircle className="size-4 text-destructive" aria-label="No" />
  );
