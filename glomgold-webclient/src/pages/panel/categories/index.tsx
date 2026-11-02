import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useCreate, useDelete, useInvalidate, useList, useTranslate, useUpdate } from "@refinedev/core";
import { Pencil, Plus, Trash } from "lucide-react";

import { CategoryBadge } from "@/components/common/CategoryBadge";
import { CategoryDeleteDialog } from "@/components/common/CategoryDeleteDialog";
import { ConfirmDeleteButton } from "@/components/common/ConfirmDeleteButton";
import { PageHeader } from "@/components/common/PageHeader";
import { SelectInput, TextInput } from "@/components/common/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { errorPayload, successPayload } from "@/utils/notify";
import type { ICategory, ICategoryGroup } from "@/interfaces";

const CATEGORY_RESOURCE = "panel/categories";
const GROUP_RESOURCE = "panel/category-groups";
const ALL = { pagination: { pageSize: 500 } };
const DEFAULT_COLOR = "#6B7280";

interface CategoryForm {
  name: string;
  color: string;
  groupId?: number | null;
}

interface GroupForm {
  name: string;
  color: string;
  position: number;
}

export const CategoriesPanel = () => {
  const translate = useTranslate();
  const invalidate = useInvalidate();
  const { result: categoryResult, query: categoryQuery } = useList<ICategory>({
    resource: CATEGORY_RESOURCE,
    ...ALL,
  });
  const { result: groupResult, query: groupQuery } = useList<ICategoryGroup>({
    resource: GROUP_RESOURCE,
    ...ALL,
  });
  const { mutate: createCategory } = useCreate();
  const { mutate: updateCategory } = useUpdate();
  const { mutate: createGroup } = useCreate();
  const { mutate: updateGroup } = useUpdate();
  const { mutate: deleteGroup } = useDelete();

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [editingGroup, setEditingGroup] = useState<ICategoryGroup | null>(null);

  const categoryForm = useForm<CategoryForm>({ defaultValues: { name: "", color: DEFAULT_COLOR } });
  const groupForm = useForm<GroupForm>({ defaultValues: { name: "", color: DEFAULT_COLOR, position: 0 } });

  const categories = useMemo(() => categoryResult?.data ?? [], [categoryResult]);
  const groups = useMemo(() => groupResult?.data ?? [], [groupResult]);
  const groupNameById = useMemo(() => new Map(groups.map((group) => [group.id, group.name] as const)), [groups]);

  const openCategoryCreate = () => {
    setEditingCategory(null);
    categoryForm.reset({ name: "", color: DEFAULT_COLOR, groupId: null });
    setCategoryOpen(true);
  };

  const openCategoryEdit = (category: ICategory) => {
    setEditingCategory(category);
    categoryForm.reset({ name: category.name, color: category.color, groupId: category.groupId });
    setCategoryOpen(true);
  };

  const submitCategory = categoryForm.handleSubmit((values) => {
    const variables = { name: values.name, color: values.color || DEFAULT_COLOR, groupId: values.groupId ?? null };
    const onSuccess = () => setCategoryOpen(false);
    if (editingCategory) {
      updateCategory(
        {
          resource: CATEGORY_RESOURCE,
          id: editingCategory.id,
          values: variables,
          successNotification: successPayload(translate("panel.category.updated", "Category updated.")),
          errorNotification: errorPayload(translate("panel.category.updateError", "Could not update category.")),
        },
        { onSuccess }
      );
    } else {
      createCategory(
        {
          resource: CATEGORY_RESOURCE,
          values: variables,
          successNotification: successPayload(translate("panel.category.created", "Category created.")),
          errorNotification: errorPayload(translate("panel.category.createError", "Could not create category.")),
        },
        { onSuccess }
      );
    }
  });

  const openGroupCreate = () => {
    setEditingGroup(null);
    groupForm.reset({ name: "", color: DEFAULT_COLOR, position: 0 });
    setGroupOpen(true);
  };

  const openGroupEdit = (group: ICategoryGroup) => {
    setEditingGroup(group);
    groupForm.reset({ name: group.name, color: group.color, position: group.position });
    setGroupOpen(true);
  };

  const submitGroup = groupForm.handleSubmit((values) => {
    const variables = { name: values.name, color: values.color || DEFAULT_COLOR, position: values.position ?? 0 };
    const onSuccess = () => setGroupOpen(false);
    if (editingGroup) {
      updateGroup(
        {
          resource: GROUP_RESOURCE,
          id: editingGroup.id,
          values: variables,
          successNotification: successPayload(translate("panel.category.group.updated", "Group updated.")),
          errorNotification: errorPayload(translate("panel.category.group.updateError", "Could not update group.")),
        },
        { onSuccess }
      );
    } else {
      createGroup(
        {
          resource: GROUP_RESOURCE,
          values: variables,
          successNotification: successPayload(translate("panel.category.group.created", "Group created.")),
          errorNotification: errorPayload(translate("panel.category.group.createError", "Could not create group.")),
        },
        { onSuccess }
      );
    }
  });

  const removeGroup = (group: ICategoryGroup) =>
    deleteGroup(
      {
        resource: GROUP_RESOURCE,
        id: group.id,
        successNotification: successPayload(translate("panel.category.group.removed", "Group removed.")),
        errorNotification: errorPayload(translate("panel.category.group.removeError", "Could not remove group.")),
      },
      // Unlinking happens server-side, so the category list becomes stale too.
      { onSuccess: () => void invalidate({ resource: CATEGORY_RESOURCE, invalidates: ["list"] }) }
    );

  return (
    <div className="flex flex-col gap-6" data-cy="categories-panel">
      <PageHeader title={translate("panel.category.pageTitle", "Categories")} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{translate("panel.category.pageTitle", "Categories")}</CardTitle>
          <Button data-cy="new-category" onClick={openCategoryCreate}>
            <Plus className="size-4" />
            {translate("panel.category.new", "New Category")}
          </Button>
        </CardHeader>
        <CardContent>
          {categoryQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("panel.category.field.name", "Name")}</TableHead>
                  <TableHead>{translate("panel.category.field.group", "Group")}</TableHead>
                  <TableHead>{translate("panel.items.column.action", "Action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <CategoryBadge category={category} />
                    </TableCell>
                    <TableCell>{groupNameById.get(category.groupId ?? -1) ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          data-cy="edit-category"
                          onClick={() => openCategoryEdit(category)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <CategoryDeleteDialog
                          record={category}
                          candidates={categories.filter((candidate) => candidate.id !== category.id)}
                          resource={CATEGORY_RESOURCE}
                          usageUrl="/api/panel/categories/usage"
                          invalidates={["list"]}
                          data-cy="remove-category"
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{translate("panel.category.group.pageTitle", "Category Groups")}</CardTitle>
          <Button data-cy="new-category-group" onClick={openGroupCreate}>
            <Plus className="size-4" />
            {translate("panel.category.group.new", "New Group")}
          </Button>
        </CardHeader>
        <CardContent>
          {groupQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{translate("panel.category.field.name", "Name")}</TableHead>
                  <TableHead>{translate("panel.category.field.position", "Position")}</TableHead>
                  <TableHead>{translate("panel.items.column.action", "Action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <CategoryBadge category={group} />
                    </TableCell>
                    <TableCell>{group.position}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" data-cy="edit-category-group" onClick={() => openGroupEdit(group)}>
                          <Pencil className="size-4" />
                        </Button>
                        <ConfirmDeleteButton
                          title={translate(
                            "panel.category.group.confirmRemove",
                            "Sure to remove? Its categories will become ungrouped."
                          )}
                          onConfirm={() => removeGroup(group)}
                        >
                          <Button variant="destructive" size="icon" data-cy="remove-category-group">
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

      <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? translate("panel.category.edit", "Edit") : translate("panel.category.new", "New Category")}
            </DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={submitCategory}>
            <TextInput
              label={translate("panel.category.field.name", "Name")}
              autoFocus
              data-cy="category-name"
              error={categoryForm.formState.errors.name?.message}
              {...categoryForm.register("name", {
                required: translate("panel.category.nameRequired", "Please input a name!"),
              })}
            />
            <TextInput
              type="color"
              label={translate("panel.category.field.color", "Color")}
              data-cy="category-color"
              {...categoryForm.register("color")}
            />
            <Controller
              control={categoryForm.control}
              name="groupId"
              render={({ field }) => (
                <SelectInput
                  label={translate("panel.category.field.group", "Group")}
                  options={groups.map((group) => ({ value: `${group.id}`, label: group.name }))}
                  value={field.value}
                  onChange={field.onChange}
                  allowClear
                />
              )}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCategoryOpen(false)}>
                {translate("panel.items.importCancel", "Cancel")}
              </Button>
              <Button type="submit">{translate("panel.profile.save", "Save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={groupOpen} onOpenChange={setGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? translate("panel.category.group.edit", "Edit group") : translate("panel.category.group.new", "New Group")}
            </DialogTitle>
          </DialogHeader>
          <form className="flex flex-col gap-4" onSubmit={submitGroup}>
            <TextInput
              label={translate("panel.category.field.name", "Name")}
              autoFocus
              data-cy="category-group-name"
              error={groupForm.formState.errors.name?.message}
              {...groupForm.register("name", {
                required: translate("panel.category.nameRequired", "Please input a name!"),
              })}
            />
            <TextInput
              type="color"
              label={translate("panel.category.field.color", "Color")}
              data-cy="category-group-color"
              {...groupForm.register("color")}
            />
            <TextInput
              type="number"
              min={0}
              label={translate("panel.category.field.position", "Position")}
              data-cy="category-group-position"
              {...groupForm.register("position", { valueAsNumber: true })}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setGroupOpen(false)}>
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
