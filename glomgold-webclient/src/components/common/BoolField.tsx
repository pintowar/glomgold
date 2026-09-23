import React from "react";
import { BooleanField } from "@refinedev/antd";
import { CheckCircleOutlined, CloseCircleOutlined } from "@ant-design/icons";

export const BoolField: React.FC<{ value: boolean }> = ({ value }) => (
  <BooleanField
    value={value}
    trueIcon={<CheckCircleOutlined />}
    falseIcon={<CloseCircleOutlined />}
    valueLabelTrue="Yes"
    valueLabelFalse="No"
  />
);
