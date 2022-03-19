import React, { useState } from "react";
import { IResourceComponentsProps } from "@pankod/refine-core";

import { Create, Form, Input, Select } from "@pankod/refine-antd";

import { useForm, useSelect } from "@pankod/refine-antd";

import "react-mde/lib/styles/css/react-mde-all.css";

import { IItem, IUser } from "interfaces";

export const ItemCreate: React.FC<IResourceComponentsProps> = () => {
    const { formProps, saveButtonProps } = useForm<IItem>({
        // warnWhenUnsavedChanges: true,
    });

    const { selectProps: userSelectProps } = useSelect<IUser>({
        resource: "users",
        optionLabel: "name",
        optionValue: "id",
    });

    const [selectedTab, setSelectedTab] =
        useState<"write" | "preview">("write");

    return (
        <Create saveButtonProps={saveButtonProps}>
            <Form {...formProps} layout="vertical">
               <Form.Item
                    label="Description"
                    name="description"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Value"
                    name="value"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Year"
                    name="year"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Month"
                    name="month"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    label="User"
                    name="userId"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Select {...userSelectProps} />
                </Form.Item>
            </Form>
        </Create>
    );
};
