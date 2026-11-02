import {
  Banknote,
  BarChart3,
  Calculator,
  Folder,
  LayoutDashboard,
  LineChart,
  LogOut,
  ShoppingCart,
  Tags,
  User,
  Users,
} from "lucide-react";
import { useLogout, usePermissions, useTranslate } from "@refinedev/core";
import { Link, useLocation } from "react-router";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/images/glomgold-logo-collapsed.png";

type NavItem = { to: string; label: string; icon: React.ElementType; exact?: boolean };
type NavGroup = { label?: string; items: NavItem[] };

export const AppSidebar = () => {
  const translate = useTranslate();
  const location = useLocation();
  const { open } = useSidebar();
  const { mutate: logout } = useLogout();
  const { data: permissions } = usePermissions<string[]>({});
  const isAdmin = permissions?.includes("ROLE_ADMIN") ?? false;

  const groups: NavGroup[] = [
    {
      items: [
        {
          to: "/panel",
          label: translate("header.menu.panel", "Panel"),
          icon: Calculator,
          exact: true,
        },
      ],
    },
    {
      label: translate("header.menu.setup", "Setup"),
      items: [
        { to: "/panel/accounts", label: translate("header.menu.accounts", "Account"), icon: Banknote },
        { to: "/panel/categories", label: translate("header.menu.categories", "Category"), icon: Tags },
      ],
    },
    {
      label: translate("header.menu.reports", "Reports"),
      items: [
        { to: "/panel/yearly-report", label: translate("header.menu.yearlyReport", "Yearly Report"), icon: LineChart },
        { to: "/panel/overall-report", label: translate("header.menu.overallReport", "Overall Report"), icon: BarChart3 },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: translate("header.menu.admin", "Admin"),
            items: [
              { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
              { to: "/admin/users", label: "Users", icon: Users },
              { to: "/admin/items", label: "Items", icon: ShoppingCart },
              { to: "/admin/accounts", label: "Accounts", icon: Banknote },
              { to: "/admin/categories", label: "Categories", icon: Tags },
              { to: "/admin/category-groups", label: "Category Groups", icon: Folder },
            ],
          },
        ]
      : []),
  ];

  const isActive = (item: NavItem) =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);

  return (
    <Sidebar collapsible="icon">
      <SidebarRail />
      <SidebarHeader className="h-16 justify-center border-b px-3">
        <Link to="/panel" className="flex items-center gap-2 overflow-hidden">
          <img src={logo} alt="Glomgold" className="h-6 w-6 shrink-0" />
          {open && <span className="text-sm font-bold">Glomgold</span>}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, index) => (
          <SidebarGroup key={group.label ?? `group-${index}`}>
            {group.label && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive(item)} tooltip={item.label}>
                      <Link to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={translate("header.menu.profile", "Profile")}>
              <Link to="/panel/profile">
                <User />
                <span>{translate("header.menu.profile", "Profile")}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => logout()} tooltip={translate("header.menu.logout", "Logout")}>
              <LogOut />
              <span>{translate("header.menu.logout", "Logout")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
