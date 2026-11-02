import { useForm } from "@refinedev/react-hook-form";
import { useTranslate, type HttpError } from "@refinedev/core";
import { Link } from "react-router";

import { ItemFormFields, type ItemFormValues } from "@/components/admin/ItemFormFields";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { IItem } from "@/interfaces";

export const ItemCreate = () => {
  const translate = useTranslate();
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
    saveButtonProps,
  } = useForm<IItem, HttpError, ItemFormValues>({
    refineCoreProps: { resource: "items" },
    warnWhenUnsavedChanges: true,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={translate("items.new", "New Item")}
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/items">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form className="flex max-w-xl flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <ItemFormFields
              register={register}
              control={control}
              setValue={setValue}
              watch={watch}
              errors={errors}
            />
            <div>
              <Button onClick={saveButtonProps.onClick} disabled={saveButtonProps.disabled}>
                {translate("buttons.save", "Save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
