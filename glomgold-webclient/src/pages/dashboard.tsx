import React, { useMemo } from "react";

import { useApiUrl, useCustom } from "@refinedev/core";
import { useSelect } from "@refinedev/antd";
import { Form, Input, Button, Select, Row, Col, Card, Space, notification } from "antd";
import { IUser } from "../interfaces";

import { axiosInstance } from "../authProvider";

const ManagementInfoCard: React.FC = () => {
    const { data } = useCustom({
        url: `/management/info`,
        method: "get",
    });

    const appInfo = useMemo(() => {
        const branch = data?.data?.git?.branch;
        const version = data?.data?.git?.build?.version;
        return { branch, version };
    }, [data]);

    return (
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
    );
};

const ChangePasswordCard: React.FC = () => {
    const apiUrl = useApiUrl();

    const onFinish = async (values: PasswordForm) => {
        const { status } = await axiosInstance.patch(`${apiUrl}/users/${values.userId}/password`, {
            password: values.password,
        });
        if (status === 200) {
            notification["success"]({
                message: "Successfuly Operation",
                description: "Password changed for selected user.",
            });
        } else {
            notification["error"]({
                message: "Operation Error",
                description: "Could not change password for selected user.",
            });
        }
    };

    interface PasswordForm {
        userId: number;
        password: string;
    }

    const [form] = Form.useForm<PasswordForm>();

    const { selectProps } = useSelect<IUser>({
        resource: "users",
        optionLabel: "name",
        optionValue: "id",
    });

    return (
        <Card
            title="Change Password"
            style={{ height: "300px", borderRadius: "15px" }}
            headStyle={{ textAlign: "center" }}
        >
            <Form form={form} name="control-hooks" onFinish={onFinish}>
                <Form.Item label="User" name="userId" rules={[{ required: true }]}>
                    <Select placeholder="Select user" {...selectProps} />
                </Form.Item>
                <Form.Item label="Password" name="password" rules={[{ required: true }]}>
                    <Input.Password />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Submit
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

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
