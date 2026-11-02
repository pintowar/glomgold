import { useForm } from "@refinedev/react-hook-form";
import { useTranslate, type HttpError } from "@refinedev/core";
import { Link } from "react-router";

import { CategoryFormFields } from "@/components/admin/CategoryFormFields";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import { useUserSelect } from "@/hooks/useUserSelect";
import type { ICategory } from "@/interfaces";

export const CategoryCreate = () => {
  const translate = useTranslate();
  const { options: userOptions } = useUserSelect();
  const { groups } = useCategories();
  const {
    register,
    control,
    watch,
    formState: { errors },
    saveButtonProps,
  } = useForm<ICategory, HttpError, ICategory>({
    refineCoreProps: { resource: "categories" },
    defaultValues: { color: "#6B7280" },
    warnWhenUnsavedChanges: true,
  });
  const userId = watch("userId");

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={translate("panel.category.new", "New Category")}
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/categories">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form className="flex max-w-xl flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <CategoryFormFields
              register={register}
              control={control}
              errors={errors}
              groups={groups}
              userId={userId}
              userOptions={userOptions}
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
