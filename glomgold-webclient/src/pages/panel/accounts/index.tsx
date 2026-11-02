import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useCreate, useDelete, useList, useTranslate, useUpdate } from "@refinedev/core";
import { Pencil, Plus, Trash } from "lucide-react";

import { ConfirmDeleteButton } from "@/components/common/ConfirmDeleteButton";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectInput, TextInput } from "@/components/common/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ACCOUNT_TYPES } from "@/constants";
import { useIdentityDefaults } from "@/hooks/useIdentityDefaults";
import { errorPayload, successPayload } from "@/utils/notify";
import type { IAccount } from "@/interfaces";

const RESOURCE = "panel-accounts";

interface AccountForm {
  name: string;
  currency: string;
  type: IAccount["type"];
}

const EMPTY: AccountForm = { name: "", currency: "", type: "CHECKING" };

export const AccountsPanel = () => {
  const translate = useTranslate();
  const { currency } = useIdentityDefaults();
  const { query, result } = useList<IAccount>({ resource: RESOURCE });
  const { mutate: createAccount } = useCreate();
  const { mutate: updateAccount } = useUpdate();
  const { mutate: removeAccount } = useDelete();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IAccount | null>(null);
  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountForm>({ defaultValues: EMPTY });

  const accounts = result?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    reset(EMPTY);
    setOpen(true);
  };

  const openEdit = (account: IAccount) => {
    setEditing(account);
    reset({ name: account.name, currency: account.currency, type: account.type });
    setOpen(true);
  };

  const onSubmit = (values: AccountForm) => {
    const variables = { name: values.name, currency: values.currency ?? "", type: values.type };
    const onSuccess = () => setOpen(false);
    if (editing) {
      updateAccount(
        {
          resource: RESOURCE,
          id: editing.id,
          values: variables,
          successNotification: successPayload(translate("panel.account.updated", "Account updated.")),
          errorNotification: errorPayload(translate("panel.account.updateError", "Could not update account.")),
        },
        { onSuccess }
      );
    } else {
      createAccount(
        {
          resource: RESOURCE,
          values: variables,
          successNotification: successPayload(translate("panel.account.created", "Account created.")),
          errorNotification: errorPayload(translate("panel.account.createError", "Could not create account.")),
        },
        { onSuccess }
      );
    }
  };

  return (
    <div className="flex flex-col gap-6" data-cy="accounts-panel">
      <PageHeader
        title={translate("panel.account.pageTitle", "Accounts")}
        actions={
          <Button data-cy="new-account" onClick={openCreate}>
            <Plus className="size-4" />
            {translate("panel.account.new", "New Account")}
          </Button>
        }
      />
      <Card>
        <CardContent>
          {query.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("panel.account.field.name", "Name")}</TableHead>
                  <TableHead>{translate("panel.account.field.type", "Type")}</TableHead>
                  <TableHead>{translate("panel.account.field.currency", "Currency")}</TableHead>
                  <TableHead>{translate("panel.items.column.action", "Action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{translate(`panel.account.type.${account.type}`, account.type)}</TableCell>
                    <TableCell>{account.currency}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" data-cy="edit-account" onClick={() => openEdit(account)}>
                          <Pencil className="size-4" />
                        </Button>
                        <ConfirmDeleteButton
                          title={translate(
                            "panel.account.confirmRemove",
                            "Sure to remove? All items of this account will be removed too."
                          )}
                          onConfirm={() =>
                            removeAccount({
                              resource: RESOURCE,
                              id: account.id,
                              successNotification: successPayload(translate("panel.account.removed", "Account removed.")),
                              errorNotification: errorPayload(
                                translate("panel.account.removeError", "Could not remove account.")
                              ),
                            })
                          }
                        >
                          <Button variant="destructive" size="icon" data-cy="remove-account">
                            <Trash className="size-4" />
                          </Button>
                        </ConfirmDeleteButton>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing ? translate("panel.account.edit", "Edit") : translate("panel.account.new", "New Account")}
            </DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <TextInput
              label={translate("panel.account.field.name", "Name")}
              autoFocus
              data-cy="account-name"
              error={errors.name?.message}
              {...register("name", {
                required: translate("panel.account.nameRequired", "Please input a name!"),
              })}
            />
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <SelectInput
                  label={translate("panel.account.field.type", "Type")}
                  options={ACCOUNT_TYPES.map((value) => ({
                    value,
                    label: translate(`panel.account.type.${value}`, value),
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <TextInput
              label={translate("panel.account.field.currency", "Currency")}
              placeholder={currency}
              maxLength={3}
              data-cy="account-currency"
              {...register("currency")}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                {translate("panel.items.importCancel", "Cancel")}
              </Button>
              <Button type="submit">{translate("panel.profile.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
