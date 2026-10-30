import React from "react";
import { useTranslate } from "@refinedev/core";
import { Form, Input, InputNumber, Select, type SelectProps } from "antd";
import { ITEM_TYPES } from "../../../constants";
import { ItemTypeIcon } from "../../common/ItemTypeIcon";
import { useLocaleNumberFormat } from "../../../hooks/useLocaleNumberFormat";

export type EditableInputType = "number" | "text" | "select" | "category";

export const ITEM_TYPE_OPTIONS = ITEM_TYPES.map((value) => ({ value, label: <ItemTypeIcon type={value} /> }));

export const useGreaterThanZeroRule = () => {
  const translate = useTranslate();
  return {
    validator: (_: unknown, value: unknown) =>
      value == null || value === "" || (value as number) > 0
        ? Promise.resolve()
        : Promise.reject(new Error(translate("panel.items.valuePositive", "Value must be greater than zero!"))),
  };
};

export interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: EditableInputType;
  locale: string;
  categoryOptions?: SelectProps["options"];
  children: React.ReactNode;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  locale,
  categoryOptions,
  children,
  ...restProps
}) => {
  const translate = useTranslate();
  const greaterThanZeroRule = useGreaterThanZeroRule();
  const { formatter, parser } = useLocaleNumberFormat(locale);
  const inputNode =
    inputType === "number" ? (
      <InputNumber min={0} formatter={formatter} parser={parser} />
    ) : inputType === "category" ? (
      <Select allowClear options={categoryOptions} />
    ) : inputType === "select" ? (
      <Select options={ITEM_TYPE_OPTIONS} />
    ) : (
      <Input />
    );

  return (
    <td {...restProps}>
      {editing ? (
        <Form.Item
          name={dataIndex}
          style={{ margin: 0 }}
          rules={[
            // Category is optional: an item may be uncategorized.
            ...(inputType === "category"
              ? []
              : [
                  {
                    required: true,
                    message: translate("panel.items.inputRequired", { title }, `Please Input ${title}!`),
                  },
                ]),
            ...(inputType === "number" ? [greaterThanZeroRule] : []),
          ]}
        >
          {inputNode}
        </Form.Item>
      ) : (
        children
      )}
    </td>
  );
};
