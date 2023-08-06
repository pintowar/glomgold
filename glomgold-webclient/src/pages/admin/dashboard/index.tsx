import React from "react";
import { Row, Col } from "antd";

import { ManagementInfoCard, ChangePasswordCard } from "../../../components";

export const DashboardPage: React.FC = () => {
  return (
    <Row gutter={20}>
      <Col span={6}>
        <ManagementInfoCard />
      </Col>
      <Col span={6}>
        <ChangePasswordCard />
      </Col>
    </Row>
  );
};
