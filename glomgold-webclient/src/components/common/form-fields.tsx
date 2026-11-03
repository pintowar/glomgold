import type React from "react";
import { Checkbox } from "../ui/checkbox";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

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
  const renderItem = (option: SelectOption) => (
    <SelectItem key={option.value} value={option.value}>
      {option.label}
    </SelectItem>
  );

  return (
    <FormRow label={label} error={error}>
      <Select
        value={value == null ? "" : String(value)}
        onValueChange={(next) => onChange(coerceValue(next))}
        disabled={disabled}
      >
        <SelectTrigger id={id} data-testid={testId} data-cy={dataCy} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {allowClear && <SelectItem value={CLEAR_VALUE}>—</SelectItem>}
          {options?.map(renderItem)}
          {groups?.map((group, index) =>
            group.label ? (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map(renderItem)}
              </SelectGroup>
            ) : (
              <SelectGroup key={`group-${index}`}>{group.options.map(renderItem)}</SelectGroup>
            )
          )}
        </SelectContent>
      </Select>
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
