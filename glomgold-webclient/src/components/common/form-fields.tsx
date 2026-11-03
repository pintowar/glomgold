import type React from "react";
import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { useTranslate } from "@refinedev/core";

import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../../lib/utils";

export const CLEAR_VALUE = "__clear__";

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectOptionGroup {
  label?: string;
  options: SelectOption[];
}

/** Radix Select only deals in strings; numeric ids are converted back at the boundary. */
export const coerceValue = (value: string): string | number | undefined => {
  if (value === CLEAR_VALUE) return undefined;
  return /^-?\d+$/.test(value) ? Number(value) : value;
};

export const FormRow = ({
  label,
  error,
  hint,
  children,
}: {
  label?: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-2">
    {label && <Label>{label}</Label>}
    {children}
    {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    {error && <span className="text-xs text-destructive">{error}</span>}
  </div>
);

export const TextInput = ({
  label,
  error,
  ...props
}: React.ComponentProps<typeof Input> & { label?: string; error?: string }) => (
  <FormRow label={label} error={error}>
    <Input {...props} />
  </FormRow>
);

export const SelectInput = ({
  label,
  error,
  value,
  onChange,
  options,
  groups,
  allowClear,
  placeholder,
  disabled,
  id,
  "data-testid": testId,
  "data-cy": dataCy,
}: {
  label?: string;
  error?: string;
  value: string | number | undefined | null;
  onChange: (value: string | number | undefined) => void;
  options?: SelectOption[];
  groups?: SelectOptionGroup[];
  allowClear?: boolean;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "data-testid"?: string;
  "data-cy"?: string;
}) => {
  const translate = useTranslate();
  const [open, setOpen] = useState(false);

  const allOptions = groups ? groups.flatMap((group) => group.options) : (options ?? []);
  const current = value == null ? undefined : allOptions.find((option) => option.value === String(value));

  const select = (next?: string) => {
    onChange(coerceValue(next ?? CLEAR_VALUE));
    setOpen(false);
  };

  // antd-like filtering: case/diacritic-insensitive substring match on the label only.
  const filterByLabel = (_value: string, search: string, keywords?: string[]) => {
    const fold = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return keywords?.some((keyword) => fold(keyword).includes(fold(search.trim()))) ? 1 : 0;
  };

  const renderItem = (option: SelectOption) => (
    <CommandItem key={option.value} value={option.value} keywords={[option.label]} onSelect={() => select(option.value)}>
      <Check className={cn("size-4 shrink-0", current?.value === option.value ? "opacity-100" : "opacity-0")} />
      <span className="truncate">{option.label}</span>
    </CommandItem>
  );

  return (
    <FormRow label={label} error={error}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            data-testid={testId}
            data-cy={dataCy}
            className="w-full justify-between font-normal"
          >
            <span className="truncate">
              {current ? current.label : <span className="text-muted-foreground">{placeholder}</span>}
            </span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-(--radix-popover-trigger-width) p-0">
          <Command filter={filterByLabel}>
            <CommandInput placeholder={translate("common.search", "Search...")} />
            <CommandList>
              <CommandEmpty>{translate("common.noResults", "No results found.")}</CommandEmpty>
              {allowClear && (
                <CommandItem value={CLEAR_VALUE} onSelect={() => select()}>
                  <span className="text-muted-foreground">—</span>
                </CommandItem>
              )}
              {options?.map(renderItem)}
              {groups?.map((group, index) => (
                <CommandGroup key={group.label ?? `group-${index}`} heading={group.label}>
                  {group.options.map(renderItem)}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </FormRow>
  );
};

export const CheckboxInput = ({
  label,
  checked,
  onCheckedChange,
  disabled,
}: {
  label?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}) => (
  <div className="flex items-center gap-2">
    <Checkbox
      id={label}
      checked={checked}
      disabled={disabled}
      onCheckedChange={(next) => onCheckedChange(next === true)}
    />
    {label && <Label htmlFor={label}>{label}</Label>}
  </div>
);
