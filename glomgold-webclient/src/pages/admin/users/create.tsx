import { useForm } from "@refinedev/react-hook-form";
import { useTranslate, type HttpError } from "@refinedev/core";
import { Link } from "react-router";

import { UserFormFields } from "@/components/admin/UserFormFields";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { IUser } from "@/interfaces";

export const UserCreate = () => {
  const translate = useTranslate();
  const {
    register,
    control,
    formState: { errors },
    saveButtonProps,
  } = useForm<IUser, HttpError, IUser>({
    refineCoreProps: { resource: "users" },
    defaultValues: { enabled: true, admin: false, locale: "en_US", timezone: "UTC" },
    warnWhenUnsavedChanges: true,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={translate("users.new", "New User")}
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/users">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form className="flex max-w-xl flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <UserFormFields register={register} control={control} errors={errors} />
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
