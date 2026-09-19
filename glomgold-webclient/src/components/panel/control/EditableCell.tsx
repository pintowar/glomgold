import React from "react";
import { Form, Input, InputNumber, Select } from "antd";
import { ITEM_TYPES } from "../../../constants";
import { ItemTypeIcon } from "../../common/ItemTypeIcon";
import { useLocaleNumberFormat } from "../../../hooks/useLocaleNumberFormat";

export type EditableInputType = "number" | "text" | "select";

export const ITEM_TYPE_OPTIONS = ITEM_TYPES.map((value) => ({ value, label: <ItemTypeIcon type={value} /> }));

export interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: string;
  inputType: EditableInputType;
  locale: string;
  children: React.ReactNode;
}

export const EditableCell: React.FC<EditableCellProps> = ({
  editing,
  dataIndex,
  title,
  inputType,
  locale,
  children,
  ...restProps
}) => {
  const { formatter, parser } = useLocaleNumberFormat(locale);
  const inputNode =
    inputType === "number" ? (
      <InputNumber min={0} formatter={formatter} parser={parser} />
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
            {
              required: true,
              message: `Please Input ${title}!`,
            },
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
