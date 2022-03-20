import React, { useMemo } from "react";
import { IResourceComponentsProps, useApiUrl, useCustom } from "@pankod/refine-core";

import { Edit, Form, Input, Checkbox, Select } from "@pankod/refine-antd";

import { useForm } from "@pankod/refine-antd";

import "react-mde/lib/styles/css/react-mde-all.css";

import { IUser } from "interfaces";

export const UserEdit: React.FC<IResourceComponentsProps> = () => {
    const apiUrl = useApiUrl();
    const { formProps, saveButtonProps, queryResult } = useForm<IUser>({
        warnWhenUnsavedChanges: true,
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
        <Edit saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
                <Form.Item
                    label="ID"
                    name="id"
                    hidden={true}
                >
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="Version"
                    name="version"
                    hidden={true}
                >
                    <Input/>
                </Form.Item>
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
                    <Select options={localeOptions} showSearch/>
                </Form.Item>
                <Form.Item
                    label="Timezone"
                    name="timezone"
                    rules={[
                        { required: true },
                    ]}
                >
                    <Select options={timezonesOptions} showSearch/>
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
        </Edit>
    );
};
