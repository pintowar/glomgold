import { useGetIdentity, useLogout, useTranslate } from "@refinedev/core";
import { LogOut, User } from "lucide-react";
import { Link } from "react-router";

import { ThemeToggle } from "@/components/refine-ui/theme/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { SessionUser } from "@/providers/session";

export const AppHeader = () => {
  const translate = useTranslate();
  const { mutate: logout } = useLogout();
  const { data: user } = useGetIdentity<SessionUser>();

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-sidebar px-4">
      <SidebarTrigger className="md:hidden" />
      <div className="flex flex-1 items-center justify-end gap-3">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 text-sm font-semibold outline-none">
            <User className="size-4" />
            {user?.name ?? translate("header.user.fallback", "Logged user")}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link to="/panel/profile">
                <User className="size-4" />
                {translate("header.menu.profile", "Profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()} className="text-destructive">
              <LogOut className="size-4" />
              {translate("header.menu.logout", "Logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
