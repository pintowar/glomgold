import React, { useState } from "react";
import { useCreate, useDelete, useList, useTranslate, useUpdate } from "@refinedev/core";
import { Button, Card, Form, Input, Modal, Popconfirm, Select, Space, Table, Typography } from "antd";

import { ACCOUNT_TYPES, type AccountType } from "../../../constants";
import type { IAccount } from "../../../interfaces";
import { useIdentityDefaults } from "../../../hooks/useIdentityDefaults";
import { errorPayload, successPayload } from "../../../utils/notify";
import { DeleteOutlined, EditOutlined } from "@ant-design/icons";

const RESOURCE = "panel-accounts";

export const AccountsPanel: React.FC = () => {
  const translate = useTranslate();
  const { currency } = useIdentityDefaults();
  const { query, result } = useList<IAccount>({ resource: RESOURCE });
  const { mutate: createAccount } = useCreate();
  const { mutate: updateAccount } = useUpdate();
  const { mutate: removeAccount } = useDelete();

  const [form] = Form.useForm<Pick<IAccount, "name" | "currency" | "type">>();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IAccount | null>(null);

  const accounts = result?.data ?? [];

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ type: "CHECKING", currency: "" });
    setOpen(true);
  };

  const openEdit = (account: IAccount) => {
    setEditing(account);
    form.resetFields();
    form.setFieldsValue({ name: account.name, currency: account.currency, type: account.type });
    setOpen(true);
  };

  const submit = () => {
    void form.validateFields().then((values) => {
      const variables = { name: values.name, currency: values.currency ?? "", type: values.type };
      const onSuccess = () => {
        setOpen(false);
        form.resetFields();
      };
      if (editing) {
        updateAccount(
          {
            resource: RESOURCE,
            id: editing.id,
            values: variables,
            successNotification: successPayload(translate("panel.account.updated", "Account updated.")),
            errorNotification: errorPayload(translate("panel.account.updateError", "Could not update account.")),
          },
          { onSuccess }
        );
      } else {
        createAccount(
          {
            resource: RESOURCE,
            values: variables,
            successNotification: successPayload(translate("panel.account.created", "Account created.")),
            errorNotification: errorPayload(translate("panel.account.createError", "Could not create account.")),
          },
          { onSuccess }
        );
      }
    });
  };

  const remove = (account: IAccount) =>
    removeAccount({
      resource: RESOURCE,
      id: account.id,
      successNotification: successPayload(translate("panel.account.removed", "Account removed.")),
      errorNotification: errorPayload(translate("panel.account.removeError", "Could not remove account.")),
    });

  return (
    <div className="card-row" data-cy="accounts-panel">
      <Card
        title={translate("panel.account.pageTitle", "Accounts")}
        variant="borderless"
        extra={
          <Button type="primary" data-cy="new-account" onClick={openCreate}>
            {translate("panel.account.new", "New Account")}
          </Button>
        }
      >
        <Table<IAccount> rowKey="id" dataSource={accounts} loading={query.isLoading} pagination={false}>
          <Table.Column dataIndex="name" title={translate("panel.account.field.name", "Name")} />
          <Table.Column
            dataIndex="type"
            title={translate("panel.account.field.type", "Type")}
            render={(value: AccountType) => translate(`panel.account.type.${value}`, value)}
          />
          <Table.Column dataIndex="currency" title={translate("panel.account.field.currency", "Currency")} />
          <Table.Column
            title={translate("panel.items.column.action", "Action")}
            render={(_, account: IAccount) => (
              <Space>
                <Button size="small" data-cy="edit-account" onClick={() => openEdit(account)}>
                  <EditOutlined />
                </Button>
                <Popconfirm
                  title={translate(
                    "panel.account.confirmRemove",
                    "Sure to remove? All items of this account will be removed too."
                  )}
                  onConfirm={() => remove(account)}
                  okText={translate("panel.profile.save", "Save")}
                  cancelText={translate("panel.items.importCancel", "Cancel")}
                >
                  <Button size="small" danger data-cy="remove-account">
                    <DeleteOutlined />
                  </Button>
                </Popconfirm>
              </Space>
            )}
          />
        </Table>
      </Card>

      <Modal
        title={editing ? translate("panel.account.edit", "Edit") : translate("panel.account.new", "New Account")}
        open={open}
        onOk={submit}
        onCancel={() => setOpen(false)}
        okText={translate("panel.profile.save", "Save")}
        cancelText={translate("panel.items.importCancel", "Cancel")}
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item
            label={translate("panel.account.field.name", "Name")}
            name="name"
            rules={[{ required: true, message: translate("panel.account.nameRequired", "Please input a name!") }]}
          >
            <Input autoFocus data-cy="account-name" />
          </Form.Item>
          <Form.Item label={translate("panel.account.field.type", "Type")} name="type">
            <Select
              data-cy="account-type"
              options={ACCOUNT_TYPES.map((value) => ({
                value,
                label: translate(`panel.account.type.${value}`, value),
              }))}
            />
          </Form.Item>
          <Form.Item
            label={translate("panel.account.field.currency", "Currency")}
            name="currency"
            extra={<Typography.Text type="secondary">{currency}</Typography.Text>}
          >
            <Input placeholder={currency} maxLength={3} data-cy="account-currency" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
