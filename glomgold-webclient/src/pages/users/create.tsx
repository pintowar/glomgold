import React, { useMemo } from "react";
import { IResourceComponentsProps, useApiUrl, useCustom } from "@pankod/refine-core";

import { Create, Form, Input, Checkbox, Select } from "@pankod/refine-antd";

import { useForm } from "@pankod/refine-antd";

import "react-mde/lib/styles/css/react-mde-all.css";

import { IUser } from "interfaces";

export const UserCreate: React.FC<IResourceComponentsProps> = () => {
    const apiUrl = useApiUrl();
    const { formProps, saveButtonProps } = useForm<IUser>({
        // warnWhenUnsavedChanges: true,
    });
    
    const { data: locales } = useCustom({
        url: `${apiUrl}/users/locales`,
        method: "get",
    });
    
    const localeOptions = useMemo(() => {
        return (locales?.data || []).map((it: string) => ({label: it, value: it}))
    }, [locales])

    const { data: timezones } = useCustom({
        url: `${apiUrl}/users/timezones`,
        method: "get",
    });

    const timezonesOptions = useMemo(() => {
        return (timezones?.data || []).map((it: string) => ({label: it, value: it}))
    }, [timezones])

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
            <Form.Item
                    label="Name"
                    name="name"
                    rules={[
                        { required: true },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Username"
                    name="username"
                    rules={[
                        { required: true },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="E-mail"
                    name="email"
                    rules={[
                        { required: true },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Password"
                    name="password"
                    rules={[
                        { required: true },
                    ]}
                >
                    <Input type={"password"}/>
                </Form.Item>
                <Form.Item
                    label="Locale"
                    name="locale"
                    rules={[
                        { required: true },
                    ]}
                >
                    <Select defaultValue="en_US" options={localeOptions} showSearch/>
                </Form.Item>
                <Form.Item
                    label="Timezone"
                    name="timezone"
                    rules={[
                        { required: true },
                    ]}
                >
                    <Select defaultValue="UTC" options={timezonesOptions} showSearch/>
                </Form.Item>
                <Form.Item
                    label="Enabled"
                    name="enabled"
                    valuePropName="checked"
                >
                    <Checkbox />
                </Form.Item>
                <Form.Item
                    label="Admin"
                    name="admin"
                    valuePropName="checked"
                >
                    <Checkbox />
                </Form.Item>
            </Form>
        </Create>
    );
};
