import { useShow, IResourceComponentsProps, useOne } from "@pankod/refine-core";

import { Show, Typography } from "@pankod/refine-antd";

import { IUser } from "interfaces";

const { Title, Text } = Typography;

export const UserShow: React.FC<IResourceComponentsProps> = () => {
    const { queryResult } = useShow<IUser>();
    const { data, isLoading } = queryResult;
    const record = data?.data;

    return (
        <Show isLoading={isLoading}>
            <Title level={5}>Id</Title>
            <Text>{record?.id}</Text>

            <Title level={5}>Name</Title>
            <Text>{record?.name}</Text>

            <Title level={5}>Username</Title>
            <Text>{record?.username}</Text>

            <Title level={5}>E-Mail</Title>
            <Text>{record?.email}</Text>

            <Title level={5}>Enabled</Title>
            <Text>{record?.enabled}</Text>
            
        </Show>
    );
};
