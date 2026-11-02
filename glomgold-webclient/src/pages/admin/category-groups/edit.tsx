import { useForm } from "@refinedev/react-hook-form";
import { useTranslate, type HttpError } from "@refinedev/core";
import { Link } from "react-router";

import { CategoryGroupFormFields } from "@/components/admin/CategoryGroupFormFields";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserSelect } from "@/hooks/useUserSelect";
import type { ICategoryGroup } from "@/interfaces";

export const CategoryGroupEdit = () => {
  const translate = useTranslate();
  const {
    register,
    control,
    formState: { errors },
    saveButtonProps,
    refineCore,
  } = useForm<ICategoryGroup, HttpError, ICategoryGroup>({
    refineCoreProps: { resource: "category-groups" },
    warnWhenUnsavedChanges: true,
  });
  const { options: userOptions } = useUserSelect(refineCore.query?.data?.data?.userId);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={translate("panel.category.group.edit", "Edit group")}
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/category-groups">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form className="flex max-w-xl flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <input type="hidden" {...register("id")} />
            <input type="hidden" {...register("version")} />
            <CategoryGroupFormFields
              register={register}
              control={control}
              errors={errors}
              userOptions={userOptions}
              userDisabled
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
