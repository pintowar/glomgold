import type { RefineThemedLayoutHeaderProps } from "@refinedev/antd";
import { useGetIdentity, useLogout, usePermissions } from "@refinedev/core";
import { Layout as AntdLayout, Dropdown, Menu, Space, Switch, Typography } from "antd";
import React, { useContext, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { ColorModeContext } from "../../contexts/color-mode";
import { IUser } from "../../interfaces";
import {
  SettingOutlined,
  DollarOutlined,
  DownOutlined,
  LineChartOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

function menuKeyFromUrl(pathname: string): string {
  if (pathname.includes("report")) {
    return "menu-report";
  } else if (pathname.includes("profile")) {
    return "menu-profile";
  } else {
    return "menu-panel";
  }
}

export const Header: React.FC<RefineThemedLayoutHeaderProps> = ({ sticky }) => {
  const { data: user } = useGetIdentity<IUser>();
  const { mode, setMode } = useContext(ColorModeContext);
  const { mutate: logout } = useLogout();
  const { data: permissionsData } = usePermissions<string[]>({});
  const isAdmin = permissionsData?.includes("ROLE_ADMIN");

  const location = useLocation();
  const isPanel = location.pathname.startsWith("/panel");
  const [selectedMenu, setSelectedMenu] = useState(menuKeyFromUrl(location.pathname));
  const [prevPathname, setPrevPathname] = useState(location.pathname);

  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    setSelectedMenu(menuKeyFromUrl(location.pathname));
  }

  const handleClick = (key: string) => setSelectedMenu(key);

  const menuItems = [
    { key: "menu-panel", label: <Link to={"/panel"}>Panel</Link>, icon: <DollarOutlined /> },
    { key: "menu-report", label: <Link to={"/panel/report"}>Report</Link>, icon: <LineChartOutlined /> },
    { key: `${isAdmin ? "admin" : ""}`, label: <Link to={"/admin"}>Admin</Link>, icon: <SettingOutlined /> },
  ].filter(({ key }) => key);

  const dropdownItems = [
    { key: "menu-profile", label: <Link to={"/panel/profile"}>Profile</Link>, icon: <UserOutlined /> },
    { key: "menu-logout", label: <div onClick={() => logout()}>Logout</div>, icon: <LogoutOutlined /> },
  ];

  const headerStyles: React.CSSProperties = {
    alignItems: "center",
    padding: "0px 24px",
    height: "64px",
  };

  if (sticky) {
    headerStyles.position = "sticky";
    headerStyles.top = 0;
    headerStyles.zIndex = 1;
  }

  return (
    <AntdLayout.Header style={headerStyles}>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        {isPanel && (
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexGrow: 1,
            }}
          >
            <Space style={{ color: "white" }}>
              <Text strong style={{ color: "white", fontSize: "large", marginRight: "24px" }}>
                Glomgold
              </Text>
            </Space>
            <Menu
              onClick={(e) => handleClick(e.key)}
              theme="dark"
              mode="horizontal"
              selectedKeys={[selectedMenu]}
              items={menuItems}
              style={{ flexGrow: 1 }}
            />
          </div>
        )}
        <div
          style={{
            display: "flex",
            flexGrow: 1,
            justifyContent: "flex-end",
          }}
        >
          <Space>
            <Switch
              checkedChildren="🌛"
              unCheckedChildren="🔆"
              onChange={() => setMode(mode === "light" ? "dark" : "light")}
              defaultChecked={mode === "dark"}
            />
            <Dropdown menu={{ items: dropdownItems }}>
              <Space style={{ color: "white" }}>
                <Text strong style={{ color: "white" }}>
                  {user?.name ?? "Logged user"}
                </Text>
                <DownOutlined />
              </Space>
            </Dropdown>
          </Space>
        </div>
      </div>
    </AntdLayout.Header>
  );
};
