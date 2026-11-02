import { useForm } from "@refinedev/react-hook-form";
import { useTranslate, type HttpError } from "@refinedev/core";
import { Link } from "react-router";

import { AccountFormFields } from "@/components/admin/AccountFormFields";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useUserSelect } from "@/hooks/useUserSelect";
import type { IAccount } from "@/interfaces";

export const AccountCreate = () => {
  const translate = useTranslate();
  const { options: userOptions } = useUserSelect();
  const {
    register,
    control,
    formState: { errors },
    saveButtonProps,
  } = useForm<IAccount, HttpError, IAccount>({
    refineCoreProps: { resource: "accounts" },
    defaultValues: { type: "CHECKING", currency: "" },
    warnWhenUnsavedChanges: true,
  });

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title={translate("panel.account.new", "New Account")}
        actions={
          <Button variant="outline" asChild>
            <Link to="/admin/accounts">Back</Link>
          </Button>
        }
      />
      <Card>
        <CardContent>
          <form className="flex max-w-xl flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
            <AccountFormFields
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
