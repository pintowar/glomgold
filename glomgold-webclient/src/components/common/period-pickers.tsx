import dayjs from "dayjs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

const yearRange = (current: number) => Array.from({ length: 21 }, (_, index) => current - 10 + index);

const monthLabels = (locale: string) => {
  const formatter = new Intl.DateTimeFormat(locale, { month: "long" });
  return Array.from({ length: 12 }, (_, index) => formatter.format(new Date(2000, index, 1)));
};

/** `value`/`onChange` use `YYYY-MM` (no dayjs object leaks into the page). */
export const MonthPicker = ({
  value,
  onChange,
  locale,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  locale: string;
  disabled?: boolean;
}) => {
  const current = dayjs(value, "YYYY-MM");
  const year = current.year();
  const month = current.month() + 1;
  const months = monthLabels(locale);

  return (
    <div className="flex gap-2">
      <Select
        value={`${month}`}
        onValueChange={(next) => onChange(`${year}-${next.padStart(2, "0")}`)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[130px]" data-testid="month-picker">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((label, index) => (
            <SelectItem key={label} value={`${index + 1}`}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={`${year}`}
        onValueChange={(next) => onChange(`${next}-${`${month}`.padStart(2, "0")}`)}
        disabled={disabled}
      >
        <SelectTrigger className="w-[100px]" data-testid="year-picker">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {yearRange(year).map((option) => (
            <SelectItem key={option} value={`${option}`}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export const YearPicker = ({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) => (
  <Select value={`${value}`} onValueChange={(next) => onChange(Number(next))} disabled={disabled}>
    <SelectTrigger className="w-[110px]" data-testid="year-picker">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      {yearRange(value).map((option) => (
        <SelectItem key={option} value={`${option}`}>
          {option}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
);
