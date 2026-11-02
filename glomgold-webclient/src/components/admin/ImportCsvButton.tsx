import { useRef } from "react";
import { useImport, useTranslate } from "@refinedev/core";
import { Loader2, Upload } from "lucide-react";

import { Button } from "../ui/button";
import type { IItem } from "../../interfaces";

/** CSV import straight into the resource (one request per row: the REST provider has no `createMany`). */
export const ImportCsvButton = () => {
  const translate = useTranslate();
  const fileRef = useRef<HTMLInputElement>(null);
  const { inputProps, isLoading } = useImport<IItem>({ resource: "items", batchSize: 1 });

  return (
    <>
      <input ref={fileRef} className="hidden" {...inputProps} />
      <Button variant="outline" disabled={isLoading} onClick={() => fileRef.current?.click()}>
        {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
        {translate("buttons.import", "Import")}
      </Button>
    </>
  );
};
