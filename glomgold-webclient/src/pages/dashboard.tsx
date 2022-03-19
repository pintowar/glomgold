import { useCustom } from "@pankod/refine-core";

import { Row, Col, Card, Typography, Space } from "@pankod/refine-antd";
import { useMemo } from "react";

const { Text } = Typography;

export const DashboardPage: React.FC = () => {
    
    const { data } = useCustom({
        url: `/management/info`,
        method: "get",
    });

    const appInfo = useMemo(() => {
        const branch = data?.data?.git?.branch;
        const version = data?.data?.git?.build?.version;
        return {branch, version}
    }, [data]);

    return (
        <Row gutter={20}>
            <Col span={6}>
                <Card
                    title="Management Info"
                    style={{ height: "300px", borderRadius: "15px" }}
                    headStyle={{ textAlign: "center" }}
                >
                    <Space align="center" direction="horizontal">
                        <ul>
                            <li>Branch: {appInfo.branch}</li>
                            <li>Version: {appInfo.version}</li>
                        </ul>
                    </Space>
                </Card>
            </Col>
        </Row>
    );
};