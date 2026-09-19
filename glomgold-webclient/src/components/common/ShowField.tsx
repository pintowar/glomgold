import React from "react";
import { Typography } from "antd";

const { Title, Text } = Typography;

export const ShowField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <>
    <Title level={5}>{label}</Title>
    <Text>{children}</Text>
  </>
);
