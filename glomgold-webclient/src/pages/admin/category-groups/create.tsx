import { useForm } from "@refinedev/react-hook-form";
import { useTranslate, type HttpError } from "@refinedev/core";
import { Link } from "react-router";

import { CategoryGroupFormFields } from "@/components/admin/CategoryGroupFormFields";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserSelect } from "@/hooks/useUserSelect";
import type { ICategoryGroup } from "@/interfaces";

export const CategoryGroupCreate = () => {
  const translate = useTranslate();
  const { options: userOptions } = useUserSelect();
  const {
    register,
    control,
    formState: { errors },
    saveButtonProps,
  } = useForm<ICategoryGroup, HttpError, ICategoryGroup>({
    refineCoreProps: { resource: "category-groups" },
    defaultValues: { color: "#6B7280", position: 0 },
    warnWhenUnsavedChanges: true,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={translate("panel.category.group.new", "New Group")}
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/category-groups">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form className="flex max-w-xl flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <CategoryGroupFormFields
              register={register}
              control={control}
              errors={errors}
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
